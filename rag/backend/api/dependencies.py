"""FastAPI dependencies — database session, optional JWT auth."""

from __future__ import annotations
import logging
from typing import Optional

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db as _get_db
from auth.jwt_utils import extract_bearer_token, get_user_from_token

logger = logging.getLogger(__name__)


# Re-export the database dependency
get_db = _get_db


async def get_current_user(request: Request) -> Optional[dict]:
    """Optional JWT authentication dependency.

    Returns:
        User dict with role info if a valid token is present,
        None for anonymous access.

    This dependency NEVER raises — anonymous access is always allowed.
    The downstream logic decides what data to expose based on the user.
    """
    authorization = request.headers.get("Authorization")
    token = extract_bearer_token(authorization)

    if not token:
        return None

    user = get_user_from_token(token)
    if user:
        logger.debug("Authenticated user: %s (role=%s)", user.get("id"), user.get("role"))
    return user


__all__ = ["get_db", "get_current_user"]
