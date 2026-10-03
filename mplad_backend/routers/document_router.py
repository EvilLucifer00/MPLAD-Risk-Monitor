from typing import Optional

from fastapi import APIRouter, Depends, Query

from services.document_service import (
    get_docs_by_constituency,
    get_docs_by_district
)

from auth.auth import get_current_dm, get_current_mp


document_router = APIRouter(
    prefix="/document",
    tags=["Documents"]
)


@document_router.get("/mp")
async def get_mp_doc(
    search: Optional[str] = Query(
        None,
        description="Search by file name or uploader"
    ),
    upload_date: Optional[str] = Query(
        None,
        description="Filter by upload date YYYY-MM-DD"
    ),
    mp: dict = Depends(get_current_mp)
):
    return await get_docs_by_constituency(
        mp,
        search,
        upload_date
    )


@document_router.get("/dm")
async def get_dm_doc(
    search: Optional[str] = Query(
        None,
        description="Search by file name or uploader"
    ),
    upload_date: Optional[str] = Query(
        None,
        description="Filter by upload date YYYY-MM-DD"
    ),
    dm: dict = Depends(get_current_dm)
):
    return await get_docs_by_district(
        dm,
        search,
        upload_date
    )
