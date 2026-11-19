from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from config.config import settings
from jose import jwt, JWTError


security = HTTPBearer()
oauth2_schema = OAuth2PasswordBearer(
    tokenUrl="/user/auth/login"
)


#---------------------- ACCESS TOKEN ---------------------#
def create_access_token(data: dict):
    """
    Create access token
    """
    to_encode = data.copy()
    # FIX: Use timezone-aware datetime
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire
    })
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


#------------------- CURRENT MP --------------------------------#
def get_current_mp(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

        user_id = payload.get("id")
        mp_name = payload.get("mp_name")

        if not user_id or not mp_name:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    return {
        "id": user_id,
        "mp_name": payload.get("mp_name"),
        "constituency": payload.get("constituency"),
        "house": payload.get("house"),
        "state": payload.get("state"),
        "dist": payload.get("dist"),
        "dm_id": payload.get("dm_id"),
    }

    
    
#------------------- CURRENT DM --------------------------------#
def get_current_dm(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

        user_id = payload.get("id")

        if not user_id:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    return {
        "id": user_id,
        "dm_name": payload.get("dm_name"),
        "dist": payload.get("dist"),
        "state": payload.get("state"),
    }


#------------------- CURRENT USER (MP or DM) -------------------#
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Validates token for either MP or DM role.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

        user_id = payload.get("id")
        if not user_id:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    if payload.get("mp_name"):
        return {
            "id": user_id,
            "role": "MP",
            "mp_name": payload.get("mp_name"),
            "constituency": payload.get("constituency"),
            "house": payload.get("house"),
            "state": payload.get("state"),
            "dist": payload.get("dist"),
            "dm_id": payload.get("dm_id"),
        }
    elif payload.get("dm_name") or payload.get("dist"):
        return {
            "id": user_id,
            "role": "DM",
            "dm_name": payload.get("dm_name"),
            "dist": payload.get("dist"),
            "state": payload.get("state"),
        }
    else:
        raise credentials_exception
