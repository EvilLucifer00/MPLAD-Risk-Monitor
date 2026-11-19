from fastapi import APIRouter,Depends
from auth.auth import get_current_mp,get_current_dm
from services.dashboard_service import mp_dashboard_stats,dm_dashboard_stats

dashboard_router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@dashboard_router.get("/details/mp")
async def get_dashboard_stats_mp(mp:dict = Depends(get_current_mp)):
    result = await mp_dashboard_stats(mp)
    return result

@dashboard_router.get("/details/dm")
async def get_dashboard_stats_dm(dm:dict = Depends(get_current_dm)):
    result = await dm_dashboard_stats(dm)
    return result