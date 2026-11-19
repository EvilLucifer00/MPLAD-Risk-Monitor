"""Database migration script — creates all tables, extensions, and pgvector indexes."""

import asyncio
import logging
from sqlalchemy import text
from database.connection import engine
from database.models import Base
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
DIM = settings.embedding_dimension


async def run_migrations():
    """Create pgvector extension, all tables, and vector columns/indexes."""
    async with engine.begin() as conn:
        # ── Check available extensions before attempting to create them ───
        res = await conn.execute(text("SELECT name FROM pg_available_extensions WHERE name IN ('vector', 'pg_trgm')"))
        available_extensions = {row[0] for row in res.fetchall()}

        has_vector = "vector" in available_extensions
        if has_vector:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            logger.info("PostgreSQL extension 'vector' ready")
        else:
            logger.warning("PostgreSQL extension 'vector' not installed on server (using ChromaDB for vectors)")

        if "pg_trgm" in available_extensions:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            logger.info("PostgreSQL extension 'pg_trgm' ready")
        else:
            logger.warning("PostgreSQL extension 'pg_trgm' not available")

        # ── Create all ORM tables ────────────────────────────────────────
        await conn.run_sync(Base.metadata.create_all)
        logger.info("ORM tables created")

        # ── Add pgvector columns (idempotent, only if vector extension exists) ──
        if has_vector:
            # Memory.embedding — for semantic memory retrieval
            await conn.execute(text(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'memories' AND column_name = 'embedding'
                    ) THEN
                        ALTER TABLE memories ADD COLUMN embedding vector({DIM});
                    END IF;
                END $$;
            """))

            # SemanticCache.query_embedding — for cache similarity search
            await conn.execute(text(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'semantic_cache' AND column_name = 'query_embedding'
                    ) THEN
                        ALTER TABLE semantic_cache ADD COLUMN query_embedding vector({DIM});
                    END IF;
                END $$;
            """))

            # ── Create HNSW indexes for vector columns ───────────────────────
            # Memory embedding index
            await conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_indexes WHERE indexname = 'ix_memories_embedding_hnsw'
                    ) THEN
                        CREATE INDEX ix_memories_embedding_hnsw
                        ON memories USING hnsw (embedding vector_cosine_ops)
                        WITH (m = 16, ef_construction = 64);
                    END IF;
                END $$;
            """))

            # Cache embedding index
            await conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_indexes WHERE indexname = 'ix_cache_embedding_hnsw'
                    ) THEN
                        CREATE INDEX ix_cache_embedding_hnsw
                        ON semantic_cache USING hnsw (query_embedding vector_cosine_ops)
                        WITH (m = 16, ef_construction = 64);
                    END IF;
                END $$;
            """))

        # Cache TTL index for cleanup
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes WHERE indexname = 'ix_cache_expires'
                ) THEN
                    CREATE INDEX ix_cache_expires ON semantic_cache (expires_at);
                END IF;
            END $$;
        """))

        # Seed default anonymous user
        await conn.execute(text("""
            INSERT INTO users (id, username, display_name, preferences)
            VALUES ('00000000-0000-0000-0000-000000000001', 'default_user', 'Default User', '{}')
            ON CONFLICT (id) DO NOTHING;
        """))

    logger.info("✅ Database migrations completed successfully.")


async def drop_all():
    """Drop all tables (use with caution)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    logger.warning("⚠️  All tables dropped.")


if __name__ == "__main__":
    asyncio.run(run_migrations())
