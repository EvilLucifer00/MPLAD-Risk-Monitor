"""FastAPI dependency injection helpers."""

from database.connection import get_db

# Re-export for convenience
__all__ = ["get_db"]
