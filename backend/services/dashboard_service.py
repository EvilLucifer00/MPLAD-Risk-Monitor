# Dashboard_service.py
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from fastapi import Query

from schemas.project_schema import DashboardStats, ProjectStatus, ProjectRiskLevel
from database.database import supabase


def _get_risk_map(projects: List[dict]) -> Dict[int, dict]:
    """
    Fetch risk scores for projects.

    mplads_new_projects.risk_id -> mplads_risk_scores.id

    IMPORTANT:
    mplads_risk_scores.work_id is the message queue work id, NOT the project id.
    So we do NOT join on work_id here.
    """
    risk_ids = list({p.get("risk_id") for p in projects if p.get("risk_id")})
    if not risk_ids:
        return {}

    res = (
        supabase
        .table("mplads_risk_scores")
        .select("*")
        .in_("id", risk_ids)
        .execute()
    )
    return {r["id"]: r for r in (res.data or [])}


def _get_cost_map(projects: List[dict]) -> Dict[int, dict]:
    """
    Fetch cost details for projects.

    mplads_new_projects.cost_details_id -> mplads_cost_details.id
    """
    cost_ids = list({p.get("cost_details_id") for p in projects if p.get("cost_details_id")})
    if not cost_ids:
        return {}

    res = (
        supabase
        .table("mplads_cost_details")
        .select("*")
        .in_("id", cost_ids)
        .execute()
    )
    return {r["id"]: r for r in (res.data or [])}


def _risk_info(p: dict, risk_map: Dict[int, dict]) -> tuple:
    risk = risk_map.get(p.get("risk_id"), {})
    risk_score = risk.get("risk_score") or 0
    risk_level = risk.get("risk_level") or ProjectRiskLevel.LOW.value
    return risk_score, risk_level


def _cost_info(p: dict, cost_map: Dict[int, dict]) -> dict:
    return cost_map.get(p.get("cost_details_id"), {})


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

    risk_map = _get_risk_map(projects)
    cost_map = _get_cost_map(projects)

    active = sum(
        1 for p in projects
        if p.get("status") not in (
            ProjectStatus.COMPLETED.value,
            ProjectStatus.REJECTED.value,
        )
    )

    high_risk = 0
    for p in projects:
        risk_score, risk_level = _risk_info(p, risk_map)
        if risk_score > 70 or risk_level in (
            ProjectRiskLevel.HIGH.value,
            ProjectRiskLevel.CRITICAL.value,
        ):
            high_risk += 1

    funds_utilized = sum(
        (_cost_info(p, cost_map).get("utilized_amount") or 0)
        for p in projects
    ) / 1e7

    completed = sum(
        1 for p in projects
        if p.get("status") == ProjectStatus.COMPLETED.value
    )

    on_track = total - high_risk - completed

    recent = sorted(
        projects,
        key=lambda p: p.get("updated_at") or p.get("created_at") or "",
        reverse=True,
    )[:5]

    recent_projects = []
    for p in recent:
        risk_score, risk_level = _risk_info(p, risk_map)
        cost = _cost_info(p, cost_map)

        recent_projects.append({
            "work_id": p["id"],
            "title": p["project_title"],
            "category": p["category"],
            "amount": cost.get("sanctioned_amount") or cost.get("estimated_cost"),
            "risk_level": risk_level,
            "risk_score": round(risk_score),
            "status": p.get("status", "PENDING"),
            "last_updated": p.get("updated_at") or p.get("created_at"),
        })

    return DashboardStats(
        active_projects=active,
        funds_utilized_cr=round(funds_utilized, 2),
        funds_entitlement_cr=5.0,
        high_risk_projects=high_risk,
        pending_approvals=sum(
            1 for p in projects
            if p.get("status") == ProjectStatus.PENDING_REVIEW.value
        ),
        total_projects=total,
        status_breakdown={
            "on_track": max(on_track, 0),
            "high_risk": high_risk,
            "completed": completed,
        },
        recent_projects=recent_projects,
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

    risk_map = _get_risk_map(projects)
    cost_map = _get_cost_map(projects)

    awaiting_review = [
        p for p in projects
        if p.get("status") == ProjectStatus.PENDING_REVIEW.value
    ]

    high_risk = []
    active = []

    for p in projects:
        _, risk_level = _risk_info(p, risk_map)

        if risk_level in (
            ProjectRiskLevel.HIGH.value,
            ProjectRiskLevel.CRITICAL.value,
        ):
            high_risk.append(p)

        if p.get("status") not in (
            ProjectStatus.COMPLETED.value,
            ProjectStatus.REJECTED.value,
        ):
            active.append(p)

    funds_utilized = sum(
        (_cost_info(p, cost_map).get("utilized_amount") or 0)
        for p in projects
    ) / 1e7

    mp_ids = {p["mp_id"] for p in projects if p.get("mp_id")}

    now = datetime.now(timezone.utc)
    waiting_over_5_days = 0

    for p in awaiting_review:
        submit_date_str = p.get("submit_date")
        if not submit_date_str:
            continue

        try:
            submit_date = datetime.fromisoformat(
                str(submit_date_str).replace("Z", "+00:00")
            )
            if submit_date.tzinfo is None:
                submit_date = submit_date.replace(tzinfo=timezone.utc)

            if (now - submit_date).days > 5:
                waiting_over_5_days += 1
        except ValueError:
            continue

    risk_breakdown = {
        "low": 0,
        "moderate": 0,
        "high": 0,
        "critical": 0,
    }

    for p in projects:
        _, risk_level = _risk_info(p, risk_map)
        key = (risk_level or "").lower()
        if key in risk_breakdown:
            risk_breakdown[key] += 1

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
        "risk_breakdown": risk_breakdown,
    }


async def dm_review_queue(
    dm: dict,
    risk: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    mp_id: Optional[int] = Query(None),
):
    q = (
        supabase
        .table("mplads_new_projects")
        .select("*")
        .eq("state", dm["state"])
        .eq("district", dm["dist"])
    )

    if category:
        q = q.eq("category", category)

    if mp_id:
        q = q.eq("mp_id", mp_id)

    # risk_level is NOT in mplads_new_projects.
    # So we cannot filter or order by risk_score/risk_level at DB level.
    rows = q.order("submit_date", desc=True).execute().data or []

    risk_map = _get_risk_map(rows)
    cost_map = _get_cost_map(rows)

    enriched = []

    for p in rows:
        risk_score, risk_level = _risk_info(p, risk_map)

        if risk and risk_level.upper() != risk.upper():
            continue

        cost = _cost_info(p, cost_map)

        enriched.append({
            "work_id": p["id"],
            "project_ref": f"PRJ-{p['id']}",
            "title": p["project_title"],
            "mp_id": p["mp_id"],
            "category": p["category"],
            "estimated_cost": cost.get("estimated_cost", 0),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "implementing_agency_id": p.get("implementing_agency_id"),
            "vendor_id": p.get("vendor_id"),
            "submitted_at": p.get("submit_date"),
            "status": p.get("status", ProjectStatus.PENDING_REVIEW.value),
        })

    enriched.sort(
        key=lambda x: x.get("risk_score") or 0,
        reverse=True,
    )

    return enriched