from datetime import datetime, timezone, date
from typing import Optional, List, Dict
from uuid import uuid4

from fastapi import File, Form, HTTPException, Query, UploadFile

from schemas.project_schema import (
    DashboardStats,
    ProjectStatus,
    ProjectRiskLevel,
    ProjectType,
)

from database.database import supabase
from services import cloudinary_service
from services.redis_service import create_job
from services.project_event_service import create_project_event
from services.notification_service import create_notification


# ============================================================================
# Enrichment helper
# ============================================================================
#
# mplads_new_projects is the main project table.
#
# Related information:
#
#   project.risk_id
#       -> mplads_risk_scores.id
#
#   project.cost_details_id
#       -> mplads_cost_details.id
#
#   project.vendor_id
#       -> mplads_vendors.id
#
# IMPORTANT:
#
#   mplads_risk_scores.work_id
#       = Redis/message-queue application work ID
#
# It is NOT mplads_new_projects.id.
# ============================================================================
def _enrich_projects(projects: List[dict]) -> List[dict]:

    if not projects:
        return []

    risk_ids = list({
        p.get("risk_id")
        for p in projects
        if p.get("risk_id") is not None
    })

    cost_ids = list({
        p.get("cost_details_id")
        for p in projects
        if p.get("cost_details_id") is not None
    })

    vendor_ids = list({
        p.get("vendor_id")
        for p in projects
        if p.get("vendor_id") is not None
    })

    # ----------------------------------------------------------------------
    # Risk records
    # ----------------------------------------------------------------------

    risk_map: Dict[int, dict] = {}

    if risk_ids:

        res = (
            supabase
            .table("mplads_risk_scores")
            .select(
                "id, work_id, risk_score, risk_level, "
                "cost_anomaly_risk, timeline_delay_risk, "
                "duplicate_work_risk, vendor_risk"
            )
            .in_("id", risk_ids)
            .execute()
        )

        risk_map = {
            r["id"]: r
            for r in (res.data or [])
        }

    # ----------------------------------------------------------------------
    # Cost records
    # ----------------------------------------------------------------------

    cost_map: Dict[int, dict] = {}

    if cost_ids:

        res = (
            supabase
            .table("mplads_cost_details")
            .select(
                "id, estimated_cost, sanctioned_amount, "
                "utilized_amount, unspent_balance"
            )
            .in_("id", cost_ids)
            .execute()
        )

        cost_map = {
            r["id"]: r
            for r in (res.data or [])
        }

    # ----------------------------------------------------------------------
    # Vendor records
    # ----------------------------------------------------------------------

    vendor_map: Dict[int, dict] = {}

    if vendor_ids:

        res = (
            supabase
            .table("mplads_vendors")
            .select(
                "id, vendor_name, registration_number, "
                "global_risk_score"
            )
            .in_("id", vendor_ids)
            .execute()
        )

        vendor_map = {
            r["id"]: r
            for r in (res.data or [])
        }

    # ----------------------------------------------------------------------
    # Build enriched result
    # ----------------------------------------------------------------------

    enriched: List[dict] = []

    for project in projects:

        risk = risk_map.get(
            project.get("risk_id"),
            {}
        )

        cost = cost_map.get(
            project.get("cost_details_id"),
            {}
        )

        vendor = vendor_map.get(
            project.get("vendor_id"),
            {}
        )

        enriched.append(
            {
                **project,

                # ----------------------------------------------------------
                # Risk data
                # ----------------------------------------------------------
                "risk_score": risk.get("risk_score"),
                "risk_level": risk.get("risk_level"),
                "cost_anomaly_risk": risk.get(
                    "cost_anomaly_risk"
                ),
                "timeline_delay_risk": risk.get(
                    "timeline_delay_risk"
                ),
                "duplicate_work_risk": risk.get(
                    "duplicate_work_risk"
                ),
                "vendor_risk": risk.get(
                    "vendor_risk"
                ),

                # Queue correlation ID
                "risk_work_id": project.get(
                    "risk_work_id"
                ),

                # Actual stored risk record ID
                "risk_id": project.get(
                    "risk_id"
                ),

                # ----------------------------------------------------------
                # Cost data
                # ----------------------------------------------------------
                "estimated_cost": cost.get(
                    "estimated_cost"
                ),
                "sanctioned_amount": cost.get(
                    "sanctioned_amount"
                ),
                "utilized_amount": cost.get(
                    "utilized_amount"
                ),
                "unspent_balance": cost.get(
                    "unspent_balance"
                ),

                # ----------------------------------------------------------
                # Vendor data
                # ----------------------------------------------------------
                "vendor_name": vendor.get(
                    "vendor_name"
                ),

                "vendor_registration_number": vendor.get(
                    "registration_number"
                ),

                "vendor_global_risk_score": vendor.get(
                    "global_risk_score"
                ),

                # ----------------------------------------------------------
                # No implementing agency table exists yet
                # ----------------------------------------------------------
                "implementing_agency": None,
            }
        )

    return enriched


# ============================================================================
# MP: list own projects
# ============================================================================
async def list_projects(
    mp: dict,
    search: Optional[str] = Query(
        None,
        description="Search in title/description",
    ),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
    ),
    risk_filter: Optional[str] = Query(
        None,
        alias="risk",
    ),
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
):

    if page < 1:
        page = 1

    if page_size < 1 or page_size > 100:
        page_size = 20

    mp_id = mp["id"]

    query = (
        supabase
        .table("mplads_new_projects")
        .select("*", count="exact")
        .eq("mp_id", mp_id)
    )

    # ----------------------------------------------------------------------
    # Search
    # ----------------------------------------------------------------------

    if search:

        search = search.strip()

        if search:
            query = query.or_(
                f"project_title.ilike.%{search}%,"
                f"description.ilike.%{search}%"
            )

    # ----------------------------------------------------------------------
    # Category
    # ----------------------------------------------------------------------

    if category:
        query = query.eq(
            "category",
            category.upper(),
        )

    # ----------------------------------------------------------------------
    # Risk filter
    #
    # risk_level exists in mplads_risk_scores, not in projects.
    # Resolve risk IDs first, then filter project.risk_id.
    # ----------------------------------------------------------------------

    if risk_filter:

        risk_res = (
            supabase
            .table("mplads_risk_scores")
            .select("id")
            .eq(
                "risk_level",
                risk_filter.upper(),
            )
            .execute()
        )

        risk_ids = [
            row["id"]
            for row in (risk_res.data or [])
        ]

        if not risk_ids:

            return {
                "data": [],
                "count": 0,
                "page": page,
                "page_size": page_size,
            }

        query = query.in_(
            "risk_id",
            risk_ids,
        )

    # ----------------------------------------------------------------------
    # Status filter
    # ----------------------------------------------------------------------

    if status_filter:

        status_val = (
            status_filter
            .upper()
            .replace(" ", "_")
        )

        query = query.eq(
            "status",
            status_val,
        )

    # ----------------------------------------------------------------------
    # Pagination
    # ----------------------------------------------------------------------

    start = (page - 1) * page_size
    end = start + page_size - 1

    response = (
        query
        .range(start, end)
        .order(
            "updated_at",
            desc=True,
        )
        .execute()
    )

    return {
        "data": _enrich_projects(
            response.data or []
        ),
        "count": response.count or 0,
        "page": page,
        "page_size": page_size,
    }


# ============================================================================
# MP: single project
# ============================================================================
async def project_by_id(
    project_id: int,
    mp: dict,
):

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
        raise HTTPException(
            status_code=404,
            detail="Project not found or unauthorized",
        )

    return _enrich_projects(
        response.data
    )[0]


# ============================================================================
# MP: create new project
# ============================================================================
#
# NEW ASYNC FLOW
#
#   1. Resolve DM
#   2. Build ML input
#   3. Generate work_id
#   4. Create cost details
#   5. Create project with risk_work_id
#   6. Create Redis job using same work_id
#   7. Create project event
#   8. Notify DM
#   9. Upload documents
#  10. Return immediately
#
# score_project() is NOT called here.
# ============================================================================
async def create_new_project(
    project_title: str = Form(...),
    category: ProjectType = Form(...),
    estimated_cost: float = Form(...),
    implementing_agency: str = Form(...),
    description: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    mp: dict = None,
):

    if not mp or "id" not in mp:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized MP context",
        )

    if estimated_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="Estimated cost cannot be negative",
        )

    # ----------------------------------------------------------------------
    # 1. Resolve DM
    # ----------------------------------------------------------------------

    dm_result = (
        supabase
        .table("mplads_dm")
        .select("id")
        .eq("dist", mp["dist"])
        .eq("state", mp["state"])
        .limit(1)
        .execute()
    )

    dm_id = (
        dm_result.data[0]["id"]
        if dm_result.data
        else None
    )

    if dm_id is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "No District Authority is configured "
                "for this MP's district and state."
            ),
        )

    # ----------------------------------------------------------------------
    # 2. Build input for risk service
    #
    # This is sent through Redis.
    # It is NOT scored in this API request.
    # ----------------------------------------------------------------------

    project_data_for_ml = {
        "project_title": project_title,
        "category": category.value,
        "estimated_cost": estimated_cost,
        "implementing_agency": implementing_agency,
        "description": description,
        "district": mp["dist"],
        "constituency": mp["constituency"],
        "state": mp["state"],
    }

    # ----------------------------------------------------------------------
    # 3. Generate application-level work ID
    #
    # THIS is the identifier that:
    #
    #   Redis job
    #       ↓
    #   mplads_new_projects.risk_work_id
    #       ↓
    #   mplads_risk_scores.work_id
    #
    # It is NOT the Redis Stream message_id.
    # It is NOT mplads_new_projects.id.
    # ----------------------------------------------------------------------

    risk_work_id = str(uuid4())

    # ----------------------------------------------------------------------
    # 4. Insert cost details
    # ----------------------------------------------------------------------

    cost_resp = (
        supabase
        .table("mplads_cost_details")
        .insert(
            {
                "estimated_cost": estimated_cost,
                "sanctioned_amount": None,
                "utilized_amount": None,
                "unspent_balance": None,
            }
        )
        .execute()
    )

    if not cost_resp.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create cost details",
        )

    cost_details_id = cost_resp.data[0]["id"]

    # ----------------------------------------------------------------------
    # 5. Insert project
    # ----------------------------------------------------------------------

    now_iso = datetime.now(
        timezone.utc
    ).isoformat()

    db_payload = {
        "mp_id": mp["id"],
        "dm_id": dm_id,

        "state": mp["state"],
        "district": mp["dist"],
        "constituency": mp["constituency"],

        "project_title": project_title,
        "category": category.value,
        "description": description,

        # Initial status
        "status": ProjectStatus.PENDING_REVIEW.value,

        "submit_date": date.today().isoformat(),

        "start_date": None,
        "end_date": None,

        "vendor_id": None,

        "rejection_reason": None,

        "latitude": None,
        "longitude": None,

        # No implementing-agency master table yet
        "implementing_agency_id": None,

        "cost_details_id": cost_details_id,

        # Risk result does not exist yet
        "risk_id": None,

        # NEW: Redis correlation ID
        "risk_work_id": risk_work_id,

        "created_at": now_iso,
        "updated_at": now_iso,
    }

    project_resp = (
        supabase
        .table("mplads_new_projects")
        .insert(db_payload)
        .execute()
    )

    if not project_resp.data:

        # Cleanup cost record because project creation failed
        (
            supabase
            .table("mplads_cost_details")
            .delete()
            .eq("id", cost_details_id)
            .execute()
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create project proposal",
        )

    new_project = project_resp.data[0]

    project_id = new_project["id"]

    constituency = new_project["constituency"]
    dist = new_project["district"]

    # ----------------------------------------------------------------------
    # 6. Create Redis risk-scoring job
    # ----------------------------------------------------------------------

    try:

        job_response = await create_job(
            request=project_data_for_ml,
            work_id=risk_work_id,
        )

    except Exception as e:

        # Queue failed, so this project cannot have its risk processed.
        # Clean up project and cost row.

        (
            supabase
            .table("mplads_new_projects")
            .delete()
            .eq("id", project_id)
            .execute()
        )

        (
            supabase
            .table("mplads_cost_details")
            .delete()
            .eq("id", cost_details_id)
            .execute()
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Project was not queued for risk analysis. "
                f"Queue error: {str(e)}"
            ),
        )

    # ----------------------------------------------------------------------
    # 7. Project lifecycle event
    #
    # Used for MP project timeline.
    # ----------------------------------------------------------------------

    try:

        await create_project_event(
            project_id=project_id,
            event_type="PROJECT_SUBMITTED",
            title="Project Submitted",
            message=(
                f"Project '{project_title}' was submitted "
                "successfully and sent for district review."
            ),
            actor_role="MP",
            actor_id=mp["id"],
            new_status=ProjectStatus.PENDING_REVIEW.value,
            metadata={
                "risk_work_id": risk_work_id,
                "queue_status": job_response.get(
                    "status",
                    "queued",
                ),
            },
        )

    except Exception as e:

        # Notification/event failure should not make a valid
        # project submission fail.
        print(
            "Project event creation failed:",
            str(e),
        )

    # ----------------------------------------------------------------------
    # 8. Notify DM about new pending project
    # ----------------------------------------------------------------------

    try:

        await create_notification(
            project_id=project_id,
            notification_type="INFO",
            title="New Project Submitted",
            message=(
                f"New project submitted by "
                f"MP {mp.get('mp_name', 'Office')}: "
                f"'{project_title}' — awaiting your review."
            ),
            recipients=[
                ("DM", dm_id),
            ],
            actor_role="MP",
            actor_id=mp["id"],
            metadata={
                "project_ref": f"PRJ-{project_id}",
                "risk_work_id": risk_work_id,
            },
        )

    except Exception as e:

        print(
            "DM notification creation failed:",
            str(e),
        )

    # ----------------------------------------------------------------------
    # 9. Upload documents
    # ----------------------------------------------------------------------

    uploaded_documents = []

    if files:

        for file in files:

            if not file or not file.filename:
                continue

            try:

                file_url = (
                    await cloudinary_service.upload_file(
                        file
                    )
                )

                doc_payload = {
                    "project_id": project_id,
                    "file_name": file.filename,
                    "file_url": file_url,
                    "uploaded_by": (
                        f"MP {mp.get('mp_name', 'Office')}"
                    ),
                    "uploaded_at": datetime.now(
                        timezone.utc
                    ).isoformat(),
                    "constituency": constituency,
                    "district": dist,
                    "upload_date": date.today().isoformat(),
                }

                doc_response = (
                    supabase
                    .table("mplads_documents")
                    .insert(doc_payload)
                    .execute()
                )

                if doc_response.data:

                    uploaded_document = (
                        doc_response.data[0]
                    )

                    uploaded_documents.append(
                        uploaded_document
                    )

            except Exception as e:

                print(
                    f"Error uploading file "
                    f"{file.filename}: {str(e)}"
                )

                continue

    # ----------------------------------------------------------------------
    # 10. Enrich returned project
    #
    # risk_id is still NULL here because worker hasn't necessarily
    # completed yet.
    # ----------------------------------------------------------------------

    enriched = (
        _enrich_projects([new_project])[0]
        if new_project
        else new_project
    )

    # ----------------------------------------------------------------------
    # 11. Return immediately
    # ----------------------------------------------------------------------

    return {
        "message": "Project submitted successfully",

        "project": enriched,

        "risk_analysis": {
            "work_id": risk_work_id,
            "status": job_response.get(
                "status",
                "queued",
            ),
        },

        "uploaded_documents_count": len(
            uploaded_documents
        ),
    }


# ============================================================================
# DM: district overview grouped by MP
# ============================================================================
async def dm_district_projects(
    dm: dict,
    search: Optional[str] = None,
):

    result = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("state", dm["state"])
        .eq("district", dm["dist"])
        .execute()
    )

    projects = result.data or []

    if not projects:
        return []

    projects = _enrich_projects(
        projects
    )

    # ----------------------------------------------------------------------
    # Fetch MP details
    # ----------------------------------------------------------------------

    mp_ids = list({
        p["mp_id"]
        for p in projects
        if p.get("mp_id") is not None
    })

    mp_map: Dict[int, dict] = {}

    if mp_ids:

        mp_result = (
            supabase
            .table("mplads_mp")
            .select(
                "id, mp_name, constituency"
            )
            .in_("id", mp_ids)
            .execute()
        )

        mp_map = {
            m["id"]: m
            for m in (mp_result.data or [])
        }

    # ----------------------------------------------------------------------
    # Aggregate
    # ----------------------------------------------------------------------

    aggregated_data: Dict[int, dict] = {}

    for project in projects:

        mp_id = project.get("mp_id")

        if mp_id is None:
            continue

        if mp_id not in aggregated_data:

            mp_info = mp_map.get(
                mp_id,
                {},
            )

            aggregated_data[mp_id] = {
                "mp_id": mp_id,
                "mp_name": mp_info.get(
                    "mp_name",
                    "Unknown MP",
                ),
                "constituency": mp_info.get(
                    "constituency",
                    "Unknown",
                ),
                "active_projects": 0,
                "utilized_amount": 0.0,
                "total_risk_score": 0.0,
                "project_count": 0,
                "risk_project_count": 0,
                "high_risk_count": 0,
            }

        agg = aggregated_data[mp_id]

        status = project.get(
            "status"
        )

        if status not in (
            ProjectStatus.COMPLETED.value,
            ProjectStatus.REJECTED.value,
        ):
            agg["active_projects"] += 1

        agg["utilized_amount"] += float(
            project.get(
                "utilized_amount"
            ) or 0
        )

        # Risk might not exist yet because the async
        # worker may still be processing it.
        risk_score = project.get(
            "risk_score"
        )

        if risk_score is not None:

            agg["total_risk_score"] += float(
                risk_score
            )

            agg["risk_project_count"] += 1

        agg["project_count"] += 1

        if project.get(
            "risk_level"
        ) in (
            ProjectRiskLevel.HIGH.value,
            ProjectRiskLevel.CRITICAL.value,
        ):
            agg["high_risk_count"] += 1

    # ----------------------------------------------------------------------
    # Build output
    # ----------------------------------------------------------------------

    final_output = []

    for mp_id, data in aggregated_data.items():

        if data["risk_project_count"] > 0:

            avg_risk = (
                data["total_risk_score"]
                / data["risk_project_count"]
            )

        else:

            avg_risk = 0

        if avg_risk >= 85:

            avg_risk_level = (
                ProjectRiskLevel.CRITICAL.value
            )

        elif avg_risk > 70:

            avg_risk_level = (
                ProjectRiskLevel.HIGH.value
            )

        elif avg_risk > 40:

            avg_risk_level = (
                ProjectRiskLevel.MODERATE.value
            )

        else:

            avg_risk_level = (
                ProjectRiskLevel.LOW.value
            )

        final_output.append(
            {
                "mp_id": mp_id,
                "mp_name": data["mp_name"],
                "constituency": data["constituency"],
                "active_projects": data["active_projects"],
                "funds_utilized_cr": round(
                    data["utilized_amount"] / 1e7,
                    2,
                ),
                "avg_risk_score": round(
                    avg_risk
                ),
                "avg_risk_level": avg_risk_level,
                "high_risk_projects": data[
                    "high_risk_count"
                ],
                "total_projects": data[
                    "project_count"
                ],
            }
        )

    # ----------------------------------------------------------------------
    # Search
    # ----------------------------------------------------------------------

    if search:

        search_lower = search.lower().strip()

        final_output = [
            mp
            for mp in final_output
            if (
                search_lower
                in mp["mp_name"].lower()
            )
            or (
                search_lower
                in mp["constituency"].lower()
            )
        ]

    final_output.sort(
        key=lambda x: x["avg_risk_score"],
        reverse=True,
    )

    return final_output


# ============================================================================
# DM: single MP detail view
# ============================================================================
async def dm_mp_projects(
    mp_id: int,
    dm: dict,
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
    ),
    risk_filter: Optional[str] = Query(
        None,
        alias="risk",
    ),
    page: int = 1,
    page_size: int = 20,
):

    if page < 1:
        page = 1

    if page_size < 1 or page_size > 100:
        page_size = 20

    # ----------------------------------------------------------------------
    # Verify MP
    # ----------------------------------------------------------------------

    mp_result = (
        supabase
        .table("mplads_mp")
        .select(
            "id, mp_name, constituency, district, state"
        )
        .eq("id", mp_id)
        .limit(1)
        .execute()
    )

    if not mp_result.data:
        raise HTTPException(
            status_code=404,
            detail="MP not found",
        )

    mp_info = mp_result.data[0]

    # ----------------------------------------------------------------------
    # Security: ensure MP is actually in this DM's district/state
    # ----------------------------------------------------------------------

    if (
        mp_info.get("state") != dm["state"]
        or mp_info.get("district") != dm["dist"]
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "MP does not belong to "
                "this district."
            ),
        )

    # ----------------------------------------------------------------------
    # Base project query
    # ----------------------------------------------------------------------

    base_query = (
        supabase
        .table("mplads_new_projects")
        .select("*", count="exact")
        .eq("mp_id", mp_id)
        .eq("district", dm["dist"])
        .eq("state", dm["state"])
    )

    # ----------------------------------------------------------------------
    # Search
    # ----------------------------------------------------------------------

    if search:

        search = search.strip()

        if search:

            base_query = base_query.or_(
                f"project_title.ilike.%{search}%,"
                f"description.ilike.%{search}%"
            )

    # ----------------------------------------------------------------------
    # Status filter
    # ----------------------------------------------------------------------

    if status_filter:

        status_val = (
            status_filter
            .upper()
            .replace(" ", "_")
        )

        base_query = base_query.eq(
            "status",
            status_val,
        )

    # ----------------------------------------------------------------------
    # Risk filter
    # ----------------------------------------------------------------------

    if risk_filter:

        risk_res = (
            supabase
            .table("mplads_risk_scores")
            .select("id")
            .eq(
                "risk_level",
                risk_filter.upper(),
            )
            .execute()
        )

        risk_ids = [
            r["id"]
            for r in (risk_res.data or [])
        ]

        if not risk_ids:

            return {
                "mp_details": {
                    "mp_name": mp_info.get(
                        "mp_name"
                    ),
                    "constituency": mp_info.get(
                        "constituency"
                    ),
                    "total_projects": 0,
                },
                "stats": {
                    "active_projects": 0,
                    "sanctioned_amount_cr": 0.0,
                    "utilized_amount_cr": 0.0,
                    "avg_risk_score": 0,
                },
                "data": [],
                "count": 0,
                "page": page,
                "page_size": page_size,
            }

        base_query = base_query.in_(
            "risk_id",
            risk_ids,
        )

    # ----------------------------------------------------------------------
    # Pagination
    # ----------------------------------------------------------------------

    start = (
        (page - 1)
        * page_size
    )

    end = (
        start
        + page_size
        - 1
    )

    response = (
        base_query
        .range(start, end)
        .order(
            "updated_at",
            desc=True,
        )
        .execute()
    )

    # ----------------------------------------------------------------------
    # Stats
    #
    # Fetch all projects without pagination.
    # ----------------------------------------------------------------------

    stats_query = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("mp_id", mp_id)
        .eq("district", dm["dist"])
        .eq("state", dm["state"])
        .execute()
    )

    all_projects = _enrich_projects(
        stats_query.data or []
    )

    total_count = len(
        all_projects
    )

    active_count = sum(
        1
        for project in all_projects
        if project.get("status")
        not in (
            ProjectStatus.COMPLETED.value,
            ProjectStatus.REJECTED.value,
        )
    )

    total_sanctioned = sum(
        float(
            project.get(
                "sanctioned_amount"
            ) or 0
        )
        for project in all_projects
    )

    total_utilized = sum(
        float(
            project.get(
                "utilized_amount"
            ) or 0
        )
        for project in all_projects
    )

    projects_with_risk = [
        project
        for project in all_projects
        if project.get("risk_score") is not None
    ]

    if projects_with_risk:

        avg_risk = (
            sum(
                float(
                    project.get(
                        "risk_score"
                    ) or 0
                )
                for project in projects_with_risk
            )
            / len(projects_with_risk)
        )

    else:

        avg_risk = 0

    return {
        "mp_details": {
            "mp_id": mp_id,
            "mp_name": mp_info.get(
                "mp_name"
            ),
            "constituency": mp_info.get(
                "constituency"
            ),
            "total_projects": total_count,
        },

        "stats": {
            "active_projects": active_count,

            "sanctioned_amount_cr": round(
                total_sanctioned / 1e7,
                2,
            ),

            "utilized_amount_cr": round(
                total_utilized / 1e7,
                2,
            ),

            "avg_risk_score": round(
                avg_risk
            ),
        },

        "data": _enrich_projects(
            response.data or []
        ),

        "count": response.count or 0,

        "page": page,

        "page_size": page_size,
    }