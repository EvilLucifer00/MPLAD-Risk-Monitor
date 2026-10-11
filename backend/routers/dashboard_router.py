from fastapi import APIRouter, Depends
from auth.auth import get_current_mp, get_current_dm
from services.dashboard_service import mp_dashboard_stats, dm_dashboard_stats

# Initialize the Dashboard router with a common prefix and tag for Swagger UI
dashboard_router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@dashboard_router.get("/details/mp")
async def get_dashboard_stats_mp(mp: dict = Depends(get_current_mp)):
    """
    Retrieve dashboard statistics for the currently logged-in MP.
    Requires a valid MP JWT token.
    """
    # Fetch statistics (e.g. project counts, funds) via the dashboard service
    result = await mp_dashboard_stats(mp)
    return result

@dashboard_router.get("/details/dm")
async def get_dashboard_stats_dm(dm: dict = Depends(get_current_dm)):
    """
    Retrieve dashboard statistics for the currently logged-in DM.
    Requires a valid DM JWT token.
    """
    # Fetch statistics via the dashboard service for the DM's district
    result = await dm_dashboard_stats(dm)
    return result