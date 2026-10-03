from fastapi import APIRouter,Depends
from auth.auth import get_current_mp
from services.reports_service import reports

report_router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@report_router.get("/summary")
async def get_reports(mp:dict = Depends(get_current_mp)):
    result  = await reports(mp)
    return result