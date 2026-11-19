"""JWT utilities — read-only token verification using the main backend's shared secret.

The RAG backend does NOT issue tokens. It verifies JWTs created by the
main platform backend (backend/auth/auth.py) to determine user identity:
  - Anonymous (no token)       → public mode, MPLADS docs only
  - MP  (mp_name in claims)    → full mode, docs + their project data
  - DM  (dm_name in claims)    → full mode, docs + district project data
"""

from __future__ import annotations
import logging
from typing import Optional

from jose import jwt, JWTError

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token.

    Returns:
        The decoded payload dict, or None if the token is invalid/expired.
    """
    if not settings.jwt_secret:
        logger.warning("JWT_SECRET not configured — cannot verify tokens")
        return None

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as e:
        logger.debug("JWT decode failed: %s", e)
        return None


def get_user_from_token(token: str) -> Optional[dict]:
    """Extract structured user info from a verified JWT.

    Returns:
        A dict with role ('mp' or 'dm'), id, and role-specific fields,
        or None if the token is invalid / anonymous.
    """
    payload = decode_token(token)
    if not payload:
        return None

    user_id = payload.get("id")
    if not user_id:
        return None

    # Determine role from claims
    mp_name = payload.get("mp_name")
    dm_name = payload.get("dm_name")

    if mp_name:
        return {
            "role": "mp",
            "id": user_id,
            "mp_name": mp_name,
            "constituency": payload.get("constituency"),
            "house": payload.get("house"),
            "state": payload.get("state"),
            "dist": payload.get("dist"),
            "dm_id": payload.get("dm_id"),
        }
    elif dm_name:
        return {
            "role": "dm",
            "id": user_id,
            "dm_name": dm_name,
            "dist": payload.get("dist"),
            "state": payload.get("state"),
        }

    # Generic authenticated user (shouldn't happen in current system)
    return {
        "role": "user",
        "id": user_id,
    }


def extract_bearer_token(authorization: str | None) -> str | None:
    """Extract token from 'Bearer <token>' header value."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None
