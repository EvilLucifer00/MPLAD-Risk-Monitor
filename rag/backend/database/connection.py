"""Async SQLAlchemy database connection pool."""

import ssl
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from config import get_settings

settings = get_settings()

# Build connect_args for SSL if host is not localhost (e.g., Neon.tech, AWS RDS)
_connect_args = {}
if settings.postgres_host not in ("localhost", "127.0.0.1", "::1"):
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
    _connect_args["ssl"] = _ssl_ctx

# Use NullPool for serverless remote databases (Neon/RDS) so connections 
# are returned immediately without client-side pool exhaustion
engine = create_async_engine(
    settings.database_url,
    echo=False,
    poolclass=NullPool,
    connect_args=_connect_args,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
