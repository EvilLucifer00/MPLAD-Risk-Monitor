from datetime import datetime, timezone,date
from typing import Optional, List

from fastapi import File, Form, HTTPException, Query, UploadFile

from schemas.project_schema import ProjectBase, DashboardStats, NewProject, ProjectStatus, ProjectRiskLevel,ProjectType
from database.database import supabase
from ml_model.service.risk_service import score_project
from services import cloudinary_service

async def list_projects(
    mp: dict,
    search: Optional[str] = Query(None, description="Search in title/description"),
    status_filter: Optional[str] = Query(None, alias="status"),
    risk_filter: Optional[str] = Query(None, alias="risk"),
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
):

    mp_id = mp["id"] 

    query = (
        supabase
        .table("mplads_new_projects")
        .select("*", count="exact")
        .eq("mp_id", mp_id)
    )

    if search:
        query = query.or_(
            f"project_title.ilike.%{search}%,"
            f"vendor_name.ilike.%{search}%,"
            f"implementing_agency.ilike.%{search}%"
        )

    if category:
        query = query.eq("category", category.upper())

    if risk_filter:
        query = query.eq("risk_level", risk_filter.upper())
        

    if status_filter:
        status_val = status_filter.upper().replace(" ", "_")
        query = query.eq("status", status_val)
    
    # Pagination
    start = (page - 1) * page_size
    end = start + page_size - 1
    response = query.range(start, end).order("updated_at", desc=True).execute()
    
    return {
        "data": response.data,
        "count": response.count,
        "page": page,
        "page_size": page_size,
    }
    

async def project_by_id(project_id: int, mp: dict):
    """
    Fetches a single project by ID, ensuring it belongs to the requesting MP (Screenshot 4 from previous prompt).
    """
    mp_id = mp["id"]
    
    response = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("id", project_id)
        .eq("mp_id", mp_id)
        .limit(1)
        .execute()
    )
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    
    return response.data[0]


async def create_new_project(
    project_title: str = Form(...),
    category: ProjectType = Form(...),
    estimated_cost: float = Form(...),
    implementing_agency: str = Form(...),
    description: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    mp: dict = None 
):
    
    
    if not mp or "id" not in mp:
        raise HTTPException(status_code=401, detail="Unauthorized MP context")

    dm_result = (
        supabase
        .table("mplads_dm")
        .select("id")
        .eq("dist", mp["dist"])
        .eq("state", mp["state"])
        .limit(1)
        .execute()
    )
    dm_id = dm_result.data[0]["id"] if dm_result.data else None

    project_data_for_ml = {
        "project_title": project_title,
        "category": category.value,
        "estimated_cost": estimated_cost,
        "implementing_agency": implementing_agency,
        "description": description,
        "district": mp["dist"],
        "constituency": mp["constituency"]
    }
    risk_results = score_project(payload=project_data_for_ml)

    db_payload = {
        "mp_id": mp["id"],
        "dm_id": dm_id,
        "state": mp["state"],
        "district": mp["dist"],
        "constituency": mp["constituency"],
        "project_title": project_title,
        "category": category.value,
        "estimated_cost": estimated_cost,
        "description": description,
        "implementing_agency": implementing_agency,
        "status": ProjectStatus.PENDING_REVIEW.value,
        "submit_date": datetime.now(timezone.utc).date().isoformat(),
        
        # ML Results
        "risk_score": risk_results.get("overall_risk_score", 0),
        "risk_level": risk_results.get("risk_level", ProjectRiskLevel.LOW.value),
        "cost_anomaly_risk": risk_results.get("cost_anomaly_risk", 0),
        "timeline_delay_risk": risk_results.get("timeline_delay_risk", 0),
        "duplicate_work_risk": risk_results.get("duplicate_work_risk", 0),
        "vendor_risk": risk_results.get("vendor_risk", 0),
        
        # Default empty values for columns not filled yet
        "sanctioned_amount": None,
        "utilized_amount": None,
        "unspent_balance": None,
        "start_date": None,
        "end_date": None,
        "vendor_name": None,
        "vendor_id": None,
        "latitude": None,
        "longitude": None,
        "rejection_reason": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    

    response = (
        supabase
        .table("mplads_new_projects")
        .insert(db_payload)
        .execute()
    )
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create project proposal")
        
    new_project = response.data[0]
    project_id = new_project["id"]
    constituency = new_project["constituency"]
    dist = new_project["district"]

    uploaded_documents = []
    first_doc_url = None

    if files:
        for file in files:
            try:
                file_url = await cloudinary_service.upload_file(file)
                
                if not first_doc_url:
                    first_doc_url = file_url

                doc_payload = {
                    "project_id": project_id,
                    "file_name": file.filename,
                    "file_url": file_url,
                    "uploaded_by": f"MP {mp.get('mp_name', 'Office')}",
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                    "constituency" : constituency.upper(),
                    "district" : dist,
                    "upload_date" : date.today()
                }

                doc_response = (
                    supabase
                    .table("mplads_documents")
                    .insert(doc_payload)
                    .execute()
                )
                
                if doc_response.data:
                    uploaded_documents.append(doc_response.data[0])
                    
            except Exception as e:
                print(f"Error uploading file {file.filename}: {str(e)}")
                continue

    return {
        "message": "Project created successfully",
        "project": new_project,
        "uploaded_documents_count": len(uploaded_documents)
    }
    
    
    
    
    

async def dm_district_projects(dm: dict, search: Optional[str] = None):
    """
    Fetches and aggregates all projects in a district grouped by MP for the DA Portal.
    Matches the "District Projects" card view.
    """
    # 1. Fetch all projects in the DM's district
    result = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("state", dm["state"])
        .eq("district", dm["dist"]) # Matches the 'district' column in mplads_new_projects
        .execute()
    )
    projects = result.data or []
    
    if not projects:
        return []
        
    # 2. Fetch MP details to map mp_id to MP Name and Constituency
    mp_ids = list({p["mp_id"] for p in projects if p.get("mp_id")})
    mp_result = (
        supabase
        .table("mplads_mp")
        .select("id, mp_name, constituency")
        .in_("id", mp_ids)
        .execute()
    )
    mp_map = {mp["id"]: mp for mp in (mp_result.data or [])}
    
    # 3. Group and aggregate in Python
    aggregated_data = {}
    
    for p in projects:
        m_id = p.get("mp_id")
        if not m_id:
            continue
            
        if m_id not in aggregated_data:
            mp_info = mp_map.get(m_id, {})
            aggregated_data[m_id] = {
                "mp_id": m_id,
                "mp_name": mp_info.get("mp_name", "Unknown MP"),
                "constituency": mp_info.get("constituency", "Unknown"),
                "active_projects": 0,
                "utilized_amount": 0.0,
                "total_risk_score": 0.0,
                "project_count": 0,
                "high_risk_count": 0
            }
            
        agg = aggregated_data[m_id]

        if p.get("status") not in (ProjectStatus.COMPLETED.value, ProjectStatus.REJECTED.value):
            agg["active_projects"] += 1

        agg["utilized_amount"] += (p.get("utilized_amount") or 0)

        agg["total_risk_score"] += (p.get("risk_score") or 0)
        agg["project_count"] += 1

        if p.get("risk_level") in (ProjectRiskLevel.HIGH.value, ProjectRiskLevel.CRITICAL.value):
            agg["high_risk_count"] += 1

    final_output = []
    for m_id, data in aggregated_data.items():
        avg_risk = data["total_risk_score"] / data["project_count"] if data["project_count"] > 0 else 0

        if avg_risk > 70:
            avg_risk_level = ProjectRiskLevel.HIGH.value
        elif avg_risk > 40:
            avg_risk_level = ProjectRiskLevel.MODERATE.value
        else:
            avg_risk_level = ProjectRiskLevel.LOW.value

        final_output.append({
            "mp_id": m_id,
            "mp_name": data["mp_name"],
            "constituency": data["constituency"],
            "active_projects": data["active_projects"],
            "funds_utilized_cr": round(data["utilized_amount"] / 1e7, 2), # Convert to Crores
            "avg_risk_score": round(avg_risk),
            "avg_risk_level": avg_risk_level,
            "high_risk_projects": data["high_risk_count"]
        })

    if search:
        search_lower = search.lower()
        final_output = [
            mp for mp in final_output
            if search_lower in mp["mp_name"].lower() or search_lower in mp["constituency"].lower()
        ]

    final_output.sort(key=lambda x: x["avg_risk_score"], reverse=True)
    
    return final_output







async def dm_mp_projects(
    mp_id: int,
    dm: dict,
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    risk_filter: Optional[str] = Query(None, alias="risk"),
    page: int = 1,
    page_size: int = 20,
):
    """
    Fetches a specific MP's details, aggregated stats, and paginated project list for the DA Portal.
    Matches the "MP Details" page.
    """
    mp_result = (
        supabase
        .table("mplads_mp")
        .select("mp_name, constituency")
        .eq("id", mp_id)
        .limit(1)
        .execute()
    )
    
    if not mp_result.data:
        raise HTTPException(status_code=404, detail="MP not found")
        
    mp_info = mp_result.data[0]

    base_query = (
        supabase
        .table("mplads_new_projects")
        .select("*", count="exact")
        .eq("mp_id", mp_id)
        .eq("district", dm["dist"])
        .eq("state", dm["state"])
    )

    # 3. Apply Filters
    if search:
        base_query = base_query.or_(
            f"project_title.ilike.%{search}%,"
            f"vendor_name.ilike.%{search}%,"
            f"implementing_agency.ilike.%{search}%"
        )
    if status_filter:
        status_val = status_filter.upper().replace(" ", "_")
        base_query = base_query.eq("status", status_val)
    if risk_filter:
        base_query = base_query.eq("risk_level", risk_filter.upper())

    # 4. Pagination
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    # Execute paginated query for the table
    response = base_query.range(start, end).order("updated_at", desc=True).execute()
    
    # 5. Fetch All Projects for this MP to calculate top-level Stats Cards
    # (Supabase doesn't support complex aggregations in one go easily, so we fetch and compute in Python)
    stats_query = (
        supabase
        .table("mplads_new_projects")
        .select("status, sanctioned_amount, utilized_amount, risk_score")
        .eq("mp_id", mp_id)
        .eq("district", dm["dist"])
        .eq("state", dm["state"])
        .execute()
    )
    all_projects = stats_query.data or []
    
    total_count = len(all_projects)
    active_count = sum(1 for p in all_projects if p.get("status") not in ("COMPLETED", "REJECTED"))
    total_sanctioned = sum(p.get("sanctioned_amount") or 0 for p in all_projects)
    total_utilized = sum(p.get("utilized_amount") or 0 for p in all_projects)
    
    avg_risk = 0
    if total_count > 0:
        avg_risk = sum(p.get("risk_score") or 0 for p in all_projects) / total_count

    return {
        "mp_details": {
            "mp_name": mp_info.get("mp_name"),
            "constituency": mp_info.get("constituency"),
            "total_projects": total_count
        },
        "stats": {
            "active_projects": active_count,
            "sanctioned_amount_cr": round(total_sanctioned / 1e7, 2),
            "utilized_amount_cr": round(total_utilized / 1e7, 2),
            "avg_risk_score": round(avg_risk)
        },
        "data": response.data,
        "count": response.count,
        "page": page,
        "page_size": page_size,
    }