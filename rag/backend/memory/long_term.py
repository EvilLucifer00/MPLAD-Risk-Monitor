"""Long-term memory — PostgreSQL + pgvector semantic memory store.

Fixes the old memory system by:
1. Storing embeddings with every memory for semantic retrieval
2. Retrieving relevant memories on EVERY turn (not just turn #1)
3. Using pgvector cosine similarity for memory search
"""

from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import text, select, update, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database.models import Memory, User, Conversation
from embeddings.encoder import encoder

logger = logging.getLogger(__name__)
settings = get_settings()


class LongTermMemory:
    """PostgreSQL + pgvector semantic memory store."""

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

    async def store_memory(
        self,
        user_id: str,
        content: str,
        memory_type: str,
        importance: float,
        db: AsyncSession,
        source_conversation_id: str | None = None,
    ) -> None:
        """Store a memory with its embedding vector for later semantic retrieval.

        Args:
            user_id: UUID of the user.
            content: Memory content text.
            memory_type: One of: name, interest, preference, fact, context, summary.
            importance: 0.0 - 1.0 importance score.
            db: Database session.
            source_conversation_id: Optional conversation this memory came from.
        """
        # Generate embedding for semantic retrieval
        embedding = encoder.encode_query(content)

        # Check for duplicate memories
        existing = await db.execute(
            select(Memory).where(
                Memory.user_id == user_id,
                Memory.memory_type == memory_type,
                Memory.content == content,
                Memory.is_active == True,
            )
        )
        if existing.scalar_one_or_none():
            logger.debug("Duplicate memory skipped: %s", content[:60])
            return

        # Insert memory (use vector column only if pgvector is available)
        has_pgvector = await self._check_pgvector(db)
        if has_pgvector:
            sql = """
                INSERT INTO memories (id, user_id, memory_type, content, importance,
                                      source_conversation_id, embedding)
                VALUES (gen_random_uuid(), :user_id, :memory_type, :content, :importance,
                        :source_conversation_id, CAST(:embedding AS vector))
            """
            params = {
                "user_id": user_id,
                "memory_type": memory_type,
                "content": content,
                "importance": importance,
                "source_conversation_id": source_conversation_id,
                "embedding": str(embedding),
            }
        else:
            sql = """
                INSERT INTO memories (id, user_id, memory_type, content, importance,
                                      source_conversation_id)
                VALUES (gen_random_uuid(), :user_id, :memory_type, :content, :importance,
                        :source_conversation_id)
            """
            params = {
                "user_id": user_id,
                "memory_type": memory_type,
                "content": content,
                "importance": importance,
                "source_conversation_id": source_conversation_id,
            }

        try:
            # Use a SAVEPOINT so failures don't poison the outer transaction
            async with db.begin_nested():
                await db.execute(text(sql), params)
            logger.debug("Stored memory [%s]: %s", memory_type, content[:60])
        except Exception as e:
            logger.warning("Store memory failed: %s", e)
            # begin_nested() auto-rolls back to the savepoint — no manual rollback needed

    async def retrieve_relevant(
        self,
        query: str,
        user_id: str,
        db: AsyncSession,
        top_k: int = 5,
    ) -> List[dict]:
        """Find memories semantically similar to the current query.

        Uses pgvector cosine similarity search on the embedding column.

        Args:
            query: Current user query.
            user_id: UUID of the user.
            db: Database session.
            top_k: Max number of memories to return.

        Returns:
            List of memory dicts with content, type, importance, similarity.
        """
        query_embedding = encoder.encode_query(query)

        has_pgvector = await self._check_pgvector(db)
        if not has_pgvector:
            sql = """
                SELECT id, memory_type, content, importance, 0.0 AS distance
                FROM memories
                WHERE user_id = :user_id
                  AND is_active = true
                ORDER BY importance DESC
                LIMIT :top_k
            """
        else:
            sql = """
                SELECT id, memory_type, content, importance,
                       embedding <=> CAST(:embedding AS vector) AS distance
                FROM memories
                WHERE user_id = :user_id
                  AND is_active = true
                  AND embedding IS NOT NULL
                ORDER BY distance ASC
                LIMIT :top_k
            """

        try:
            params = {"user_id": user_id, "top_k": top_k}
            if has_pgvector:
                params["embedding"] = str(query_embedding)
            result = await db.execute(text(sql), params)
            rows = result.fetchall()

            memories = []
            for row in rows:
                similarity = 1.0 - row.distance
                if similarity < 0.3:  # Skip very low similarity memories
                    continue
                memories.append({
                    "id": str(row.id),
                    "memory_type": row.memory_type,
                    "content": row.content,
                    "importance": row.importance,
                    "similarity": similarity,
                })

                # Update access stats
                try:
                    async with db.begin_nested():
                        await db.execute(
                            text("""
                                UPDATE memories SET
                                    last_accessed = :now,
                                    access_count = access_count + 1
                                WHERE id = :id
                            """),
                            {"now": datetime.now(timezone.utc), "id": str(row.id)},
                        )
                except Exception:
                    pass  # Non-critical

            logger.debug("Retrieved %d relevant memories for user %s", len(memories), user_id[:8])
            return memories

        except Exception as e:
            logger.warning("Memory retrieval failed: %s", e)
            return []

    async def get_user_profile(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> dict:
        """Build a structured user profile from all stored memories.

        Returns:
            Dict with name, interests, facts, preferences, context,
            conversation_count, total_memories.
        """
        # Get user record
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()

        # Get all active memories
        memories_result = await db.execute(
            select(Memory)
            .where(Memory.user_id == user_id, Memory.is_active == True)
            .order_by(desc(Memory.importance))
        )
        all_memories = memories_result.scalars().all()

        # Count conversations
        conv_count_result = await db.execute(
            select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
        )
        conv_count = conv_count_result.scalar() or 0

        profile = {
            "user_id": str(user_id),
            "display_name": user.display_name if user else None,
            "username": user.username if user else None,
            "name": None,
            "interests": [],
            "facts": [],
            "preferences": [],
            "context": [],
            "conversation_count": conv_count,
            "total_memories": len(all_memories),
        }

        for mem in all_memories:
            if mem.memory_type == "name":
                profile["name"] = mem.content
            elif mem.memory_type == "interest":
                profile["interests"].append({
                    "content": mem.content, "importance": mem.importance,
                })
            elif mem.memory_type == "fact":
                profile["facts"].append({
                    "content": mem.content, "importance": mem.importance,
                })
            elif mem.memory_type == "preference":
                profile["preferences"].append({
                    "content": mem.content, "importance": mem.importance,
                })
            elif mem.memory_type == "context":
                profile["context"].append({
                    "content": mem.content, "importance": mem.importance,
                })

        return profile


# Module-level singleton
long_term_memory = LongTermMemory()
