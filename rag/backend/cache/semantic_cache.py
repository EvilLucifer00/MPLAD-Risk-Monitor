"""Semantic cache — pgvector-based similarity cache for query/answer pairs.

On every incoming query:
1. Compute embedding
2. Search semantic_cache table for cosine similarity >= threshold
3. If hit AND not expired → return cached answer (skip entire RAG pipeline)
4. If miss → run pipeline → store result in cache

Cache partitioning:
- Anonymous queries are cached globally
- MP-specific queries are cached per mp_id (project data is personal)
"""

from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from embeddings.encoder import encoder

logger = logging.getLogger(__name__)
settings = get_settings()


class SemanticCache:
    """PostgreSQL + pgvector semantic cache manager."""

    _has_pgvector: bool | None = None

    async def _check_pgvector(self, db: AsyncSession) -> bool:
        if self._has_pgvector is not None:
            return self._has_pgvector
        try:
            res = await db.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
            self._has_pgvector = bool(res.scalar())
        except Exception:
            self._has_pgvector = False
            try:
                await db.rollback()
            except Exception:
                pass
        return self._has_pgvector

    async def lookup(
        self,
        query: str,
        query_embedding: list[float],
        db: AsyncSession,
        user_role: str = "anonymous",
        user_id: str | None = None,
    ) -> Optional[dict]:
        """Search for a cached answer similar to the query."""
        if not settings.cache_enabled:
            return None

        if not await self._check_pgvector(db):
            return None

        threshold = settings.cache_similarity_threshold
        # Convert cosine similarity threshold to cosine distance threshold
        # pgvector <=> returns distance, not similarity
        # distance = 1 - similarity, so threshold_distance = 1 - threshold
        distance_threshold = 1.0 - threshold

        # Build query with role-based partitioning
        role_filter = ""
        params = {
            "embedding": str(query_embedding),
            "distance_threshold": distance_threshold,
            "now": datetime.now(timezone.utc),
        }

        if user_role != "anonymous" and user_id:
            # MP/DM-specific cache
            role_filter = "AND (user_role = :user_role AND user_id = :user_id)"
            params["user_role"] = user_role
            params["user_id"] = str(user_id)
        else:
            # Anonymous — only match anonymous cache entries
            role_filter = "AND user_role = 'anonymous'"

        sql = f"""
            SELECT id, query_text, answer_text, citations, metadata,
                   query_embedding <=> :embedding::vector AS distance
            FROM semantic_cache
            WHERE query_embedding <=> :embedding::vector < :distance_threshold
              AND expires_at > :now
              {role_filter}
            ORDER BY distance ASC
            LIMIT 1
        """

        try:
            result = await db.execute(text(sql), params)
            row = result.fetchone()

            if row:
                # Update hit count
                try:
                    async with db.begin_nested():
                        await db.execute(
                            text("UPDATE semantic_cache SET hit_count = hit_count + 1 WHERE id = :id"),
                            {"id": str(row.id)},
                        )
                except Exception:
                    pass  # Non-critical

                similarity = 1.0 - row.distance
                logger.info(
                    "Cache HIT (similarity=%.3f): '%s'",
                    similarity, row.query_text[:80],
                )
                return {
                    "answer_text": row.answer_text,
                    "citations": row.citations,
                    "metadata": row.metadata,
                    "cache_hit": True,
                    "similarity": similarity,
                }
        except Exception as e:
            logger.warning("Cache lookup failed: %s", e)

        return None

    async def store(
        self,
        query: str,
        query_embedding: list[float],
        answer: str,
        citations: list | None,
        metadata: dict | None,
        db: AsyncSession,
        user_role: str = "anonymous",
        user_id: str | None = None,
    ) -> None:
        """Store a query/answer pair in the cache."""
        if not settings.cache_enabled:
            return

        if not await self._check_pgvector(db):
            return

        ttl_hours = settings.cache_ttl_hours
        expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)

        import json
        sql = """
            INSERT INTO semantic_cache
                (query_text, query_embedding, answer_text, citations, metadata,
                 user_role, user_id, expires_at)
            VALUES
                (:query_text, :embedding::vector, :answer_text, :citations::jsonb,
                 :metadata::jsonb, :user_role, :user_id, :expires_at)
        """

        try:
            async with db.begin_nested():
                await db.execute(text(sql), {
                    "query_text": query,
                    "embedding": str(query_embedding),
                    "answer_text": answer,
                    "citations": json.dumps(citations) if citations else "null",
                    "metadata": json.dumps(metadata) if metadata else "{}",
                    "user_role": user_role,
                    "user_id": str(user_id) if user_id else None,
                    "expires_at": expires_at,
                })
            logger.info("Cached answer for: '%s' (TTL=%dh)", query[:80], ttl_hours)
        except Exception as e:
            logger.warning("Cache store failed: %s", e)
            # begin_nested() auto-rolls back to the savepoint

    async def invalidate_all(self, db: AsyncSession) -> int:
        """Invalidate all cache entries (e.g., after document re-ingestion).

        Returns:
            Number of entries deleted.
        """
        try:
            result = await db.execute(text("DELETE FROM semantic_cache"))
            await db.flush()
            count = result.rowcount
            logger.info("Cache invalidated: %d entries deleted", count)
            return count
        except Exception as e:
            logger.warning("Cache invalidation failed: %s", e)
            return 0

    async def cleanup_expired(self, db: AsyncSession) -> int:
        """Remove expired cache entries.

        Returns:
            Number of entries removed.
        """
        try:
            result = await db.execute(
                text("DELETE FROM semantic_cache WHERE expires_at < :now"),
                {"now": datetime.now(timezone.utc)},
            )
            await db.flush()
            count = result.rowcount
            if count > 0:
                logger.info("Cleaned up %d expired cache entries", count)
            return count
        except Exception as e:
            logger.warning("Cache cleanup failed: %s", e)
            return 0


# Module-level singleton
semantic_cache = SemanticCache()
