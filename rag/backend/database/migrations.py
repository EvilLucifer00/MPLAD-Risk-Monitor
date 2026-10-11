"""Database migration script — creates all tables, extensions, and indexes."""

import asyncio
from sqlalchemy import text
from database.connection import engine
from database.models import Base
from config import get_settings

settings = get_settings()


async def run_migrations():
    """Create pgvector extension and all tables."""
    async with engine.begin() as conn:
        # Enable pg_trgm for fuzzy text search
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)



    print("✅ Database migrations completed successfully.")


async def drop_all():
    """Drop all tables (use with caution)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("⚠️  All tables dropped.")


if __name__ == "__main__":
    asyncio.run(run_migrations())
