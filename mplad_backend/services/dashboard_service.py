from datetime import datetime, timezone
from typing import Optional

from fastapi import Query

from schemas.project_schema import DashboardStats, ProjectStatus, ProjectRiskLevel
from database.database import supabase

async def mp_dashboard_stats(mp: dict):
    
    mp_id = mp["id"] 
    
    response = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("mp_id", mp_id)
        .execute()
    )
    
    projects = response.data or []
    total = len(projects)

    active = sum(
        1 for p in projects
        if p.get("status") not in (ProjectStatus.COMPLETED.value, ProjectStatus.REJECTED.value)
    )
    
    high_risk = sum(
        1 for p in projects
        if (p.get("risk_score") or 0) > 70
        or p.get("risk_level") in (ProjectRiskLevel.HIGH.value, ProjectRiskLevel.CRITICAL.value)
    )

    funds_utilized = sum(
        (p.get("utilized_amount") or 0) for p in projects
    ) / 1e7 
    
    completed = sum(
        1 for p in projects if p.get("status") == ProjectStatus.COMPLETED.value
    )
    
    on_track = total - high_risk - completed
    

    recent = sorted(
        projects,
        key=lambda p: p.get("updated_at") or p.get("created_at") or "",
        reverse=True,
    )[:5]
    
    return DashboardStats(
        active_projects=active,
        funds_utilized_cr=round(funds_utilized, 2),
        funds_entitlement_cr=5.0, 
        high_risk_projects=high_risk,
        pending_approvals=sum(1 for p in projects if p.get("status") == ProjectStatus.PENDING_REVIEW.value),      
        total_projects=total,
        status_breakdown={
            "on_track": max(on_track, 0),
            "high_risk": high_risk,
            "completed": completed,
        },
        recent_projects=[
            {
                "work_id": p["id"],
                "title": p["project_title"],
                "category": p["category"],
                "amount": p.get("sanctioned_amount") or p.get("estimated_cost"),
                "risk_level": p.get("risk_level", "LOW"),
                "risk_score": round(p.get("risk_score") or 0),
                "status": p.get("status", "PENDING"),
                "last_updated": p.get("updated_at") or p.get("created_at"),
            }
            for p in recent
        ],
    )


async def dm_dashboard_stats(dm: dict):

    result = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("district", dm["dist"])
        .eq("state", dm["state"])
        .execute()
    )
    
    projects = result.data or []
    
    awaiting_review = [p for p in projects if p.get("status") == ProjectStatus.PENDING_REVIEW.value]
    high_risk = [
        p for p in projects 
        if p.get("risk_level") in (ProjectRiskLevel.HIGH.value, ProjectRiskLevel.CRITICAL.value)
    ]
    active = [
        p for p in projects 
        if p.get("status") not in (ProjectStatus.COMPLETED.value, ProjectStatus.REJECTED.value)
    ]
    
    funds_utilized = sum((p.get("utilized_amount") or 0) for p in projects) / 1e7

    mp_ids = {p["mp_id"] for p in projects if p.get("mp_id")}

    now = datetime.now(timezone.utc)
    waiting_over_5_days = 0
    
    for p in awaiting_review:
        if p.get("submit_date"):
            try:
                submit_date_str = p["submit_date"].replace("Z", "+00:00")
                submit_date = datetime.fromisoformat(submit_date_str)
                if submit_date.tzinfo is None:
                    submit_date = submit_date.replace(tzinfo=timezone.utc)
                    
                if (now - submit_date).days > 5:
                    waiting_over_5_days += 1
            except ValueError:
                continue

    return {
        "district": dm["dist"],
        "projects_awaiting_review": len(awaiting_review),
        "waiting_over_5_days": waiting_over_5_days,
        "docs_pending_verification": 0,
        "mps_monitored": len(mp_ids),
        "funds_utilized_cr": round(funds_utilized, 2),
        "funds_entitlement_cr": 25.0,
        "high_risk_projects": len(high_risk),
        "active_projects": len(active),
        "risk_breakdown": {
            "low": sum(1 for p in projects if p.get("risk_level") == ProjectRiskLevel.LOW.value),
            "moderate": sum(1 for p in projects if p.get("risk_level") == ProjectRiskLevel.MODERATE.value),
            "high": sum(1 for p in projects if p.get("risk_level") == ProjectRiskLevel.HIGH.value),
            "critical": sum(1 for p in projects if p.get("risk_level") == ProjectRiskLevel.CRITICAL.value),
        },
    }
    

async def dm_review_queue(
    dm: dict,
    risk: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    mp_id: Optional[int] = Query(None)
):
    q = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("state", dm["state"])
        .eq("district", dm["dist"])
    )
    
    if risk: 
        q = q.eq("risk_level", risk.upper())
    if category: 
        q = q.eq("category", category)
    if mp_id: 
        q = q.eq("mp_id", mp_id)

    rows = q.order("risk_score", desc=True).execute().data or []
    
    return [
        {
            "work_id": p["id"],
            "project_ref": f"PRJ-{p['id']}",
            "title": p["project_title"],
            "mp_id": p["mp_id"],
            "category": p["category"],
            "estimated_cost": p.get("estimated_cost", 0), 
            "risk_score": p.get("risk_score", 0),
            "risk_level": p.get("risk_level", "LOW"),
            "implementing_agency": p.get("implementing_agency"),
            "submitted_at": p.get("submit_date"),
            "status": p.get("status", ProjectStatus.PENDING_REVIEW.value),
        }
        for p in rows
    ]