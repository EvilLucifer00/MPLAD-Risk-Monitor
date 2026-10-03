from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from typing import Optional, List

from auth.auth import get_current_mp, get_current_dm
from schemas.project_schema import ProjectType
from services.project_service import (
    list_projects, 
    project_by_id, 
    create_new_project, 
    dm_district_projects,
    dm_mp_projects # Import the new function
)

project_router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

# ==========================================
# 1. MY PROJECTS (MP Portal)
# ==========================================
@project_router.get("/all")
async def get_list_projects(
    search: Optional[str] = Query(None, description="Search in title/vendor/agency"),
    status: Optional[str] = Query(None, description="Filter by status (e.g., COMPLETED, IN_PROGRESS)"),
    risk: Optional[str] = Query(None, description="Filter by risk level (e.g., LOW, HIGH, CRITICAL)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    mp: dict = Depends(get_current_mp)
):
    result = await list_projects(
        mp=mp,
        search=search,
        status_filter=status,
        risk_filter=risk,
        category=category,
        page=page,
        page_size=page_size
    )
    return result


# ==========================================
# 2. SUBMIT NEW PROPOSAL (Multipart Form + Cloudinary)
# ==========================================
@project_router.post("/submit")
async def submit_new_project(
    project_title: str = Form(...),
    category: ProjectType = Form(...),
    estimated_cost: float = Form(...),
    implementing_agency: str = Form(...),
    description: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    mp: dict = Depends(get_current_mp)
):
    result = await create_new_project(
        project_title=project_title,
        category=category,
        estimated_cost=estimated_cost,
        implementing_agency=implementing_agency,
        description=description,
        files=files,
        mp=mp
    )
    return result


# ==========================================
# 3. DISTRICT PROJECTS - OVERVIEW (DA/DM Portal)
# ==========================================
@project_router.get("/district/overview")
async def get_district_projects(
    search: Optional[str] = Query(None, description="Search by MP name or constituency"),
    dm: dict = Depends(get_current_dm)
):
    result = await dm_district_projects(dm=dm, search=search)
    return result


# ==========================================
# 4. SPECIFIC MP PROJECTS (DA/DM Portal)
# ==========================================
@project_router.get("/district/mp/{mp_id}")
async def get_dm_mp_projects(
    mp_id: int,
    search: Optional[str] = Query(None, description="Search in title/vendor/agency"),
    status: Optional[str] = Query(None, description="Filter by status"),
    risk: Optional[str] = Query(None, description="Filter by risk level"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    dm: dict = Depends(get_current_dm)
):
    """
    Fetches a specific MP's details, aggregated stats, and project list.
    Matches the "MP Details" page for the DA Portal.
    """
    result = await dm_mp_projects(
        mp_id=mp_id,
        dm=dm,
        search=search,
        status_filter=status,
        risk_filter=risk,
        page=page,
        page_size=page_size
    )
    return result


# ==========================================
# 5. SINGLE PROJECT DETAILS (Generic)
# ==========================================
@project_router.get("/{project_id}")
async def get_project_by_id(
    project_id: int,
    mp: dict = Depends(get_current_mp)
):
    """
    Fetches detailed information for a specific project.
    """
    result = await project_by_id(project_id=project_id, mp=mp)
    return result