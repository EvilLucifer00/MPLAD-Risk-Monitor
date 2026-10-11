from fastapi import APIRouter, Depends
from auth.auth import get_current_mp, get_current_dm
from services.user_service import login, me, register_mp, register_dm, get_all_dm, get_dm_by_dist
from schemas.user_schema import LoginRequest, RegisterDMRequest, RegisterMPRequest

# Initialize the User router for authentication and user management
user_router = APIRouter(
    prefix="/user",
    tags=["User Login"]
)

@user_router.post("/auth/login")
async def login_user(user: LoginRequest):
    """
    Authenticate a user (MP or DM) and return a JWT access token.
    """
    result = await login(user)
    return result

@user_router.get("/auth/MP/me")
async def user_me_mp(mp: dict = Depends(get_current_mp)):
    """
    Get the currently authenticated MP's profile information.
    """
    result = await me(mp)
    return result

@user_router.get("/auth/DM/me")
async def user_me_dm(dm: dict = Depends(get_current_dm)):
    """
    Get the currently authenticated DM's profile information.
    """
    result = await me(dm)
    return result

@user_router.post("/create/mp")
async def create_new_user_mp(user: RegisterMPRequest):
    """
    Register a new Member of Parliament (MP).
    """
    result = await register_mp(user)
    return result

@user_router.post("/create/dm")
async def create_new_user_dm(user: RegisterDMRequest):
    """
    Register a new District Magistrate (DM).
    """
    result = await register_dm(user)
    return result

@user_router.get("/dm/all")
async def get_dm_all():
    """
    Retrieve a list of all registered DMs.
    """
    result = await get_all_dm()
    return result

@user_router.get("/dm/{dist}")
async def get_dm_dist(dist: str):
    """
    Retrieve a specific DM by their district name.
    """
    result = await get_dm_by_dist(dist)
    return result