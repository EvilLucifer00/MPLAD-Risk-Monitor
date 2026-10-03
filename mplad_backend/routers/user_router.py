from fastapi import APIRouter,Depends
from auth.auth import get_current_mp,get_current_dm
from services.user_service import login,me,register_mp,register_dm,get_all_dm,get_dm_by_dist
from schemas.user_schema import LoginRequest,RegisterDMRequest,RegisterMPRequest

user_router = APIRouter(
    prefix="/user",
    tags=["User Login"]
)


@user_router.post("/auth/login")
async def login_user(user:LoginRequest):
    result = await login(user)
    return result


@user_router.get("/auth/MP/me")
async def user_me(mp:dict=Depends(get_current_mp)):
    result = await me(mp)
    return result

@user_router.get("/auth/DM/me")
async def user_me(dm:dict=Depends(get_current_dm)):
    result = await me(dm)
    return result

@user_router.post("/create/mp")
async def create_new_user(user:RegisterMPRequest):
    result = await register_mp(user)
    return result

@user_router.post("/create/dm")
async def create_new_user(user:RegisterDMRequest):
    result = await register_dm(user)
    return result

@user_router.get("/dm/all")
async def get_dm_all():
    result = await get_all_dm()
    return result

@user_router.get("/dm/{dist}")
async def get_dm_dist(dist:str):
    result = await get_dm_by_dist(dist)
    return result