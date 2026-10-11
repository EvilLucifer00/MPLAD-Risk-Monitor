from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from config.config import settings
from jose import jwt, JWTError


# Security schemes for dependency injection in FastAPI routes
security = HTTPBearer()
oauth2_schema = OAuth2PasswordBearer(
    tokenUrl="/user/auth/login"
)


#---------------------- ACCESS TOKEN ---------------------#
def create_access_token(data: dict):
    """
    Generate a new JSON Web Token (JWT) for user session management.
    
    Args:
        data (dict): The payload data to encode into the token (e.g., user ID, role).
        
    Returns:
        str: The encoded JWT string.
    """
    to_encode = data.copy()
    
    # Set expiration time using a timezone-aware UTC datetime
    # The expiration duration is configured in the environment settings
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire
    })
    
    # Sign the token using the secret key and algorithm from settings
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


#------------------- CURRENT MP --------------------------------#
def get_current_mp(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Dependency function to authenticate and retrieve the currently logged-in MP (Member of Parliament).
    It extracts the JWT token from the Authorization header, verifies it, and returns the MP's details.
    
    Args:
        credentials (HTTPAuthorizationCredentials): Injected automatically by FastAPI's HTTPBearer.
        
    Raises:
        HTTPException: 401 Unauthorized if the token is invalid, expired, or missing required MP claims.
        
    Returns:
        dict: The decoded MP data payload.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        # Decode and verify the JWT signature and expiration
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

        user_id = payload.get("id")
        mp_name = payload.get("mp_name")

        # Ensure that this token actually belongs to an MP profile
        if not user_id or not mp_name:
            raise credentials_exception

    except JWTError:
        # Catch any token validation errors (expired, malformed, invalid signature)
        raise credentials_exception

    # Return the verified MP claims
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
    """
    Dependency function to authenticate and retrieve the currently logged-in DM (District Magistrate).
    It extracts the JWT token, verifies it, and returns the DM's details.
    
    Args:
        credentials (HTTPAuthorizationCredentials): Injected automatically by FastAPI's HTTPBearer.
        
    Raises:
        HTTPException: 401 Unauthorized if the token is invalid, expired, or missing required DM claims.
        
    Returns:
        dict: The decoded DM data payload.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        # Decode and verify the JWT signature and expiration
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

        user_id = payload.get("id")

        # Basic check to ensure a user ID is present in the token payload
        if not user_id:
            raise credentials_exception

    except JWTError:
        # Catch token validation errors
        raise credentials_exception

    # Return the verified DM claims
    return {
        "id": user_id,
        "dm_name": payload.get("dm_name"),
        "dist": payload.get("dist"),
        "state": payload.get("state"),
    }
