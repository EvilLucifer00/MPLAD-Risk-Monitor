"""Project lookup tool — queries the main platform database for MP/DM project data.

Available ONLY to authenticated MPs and DMs.
Uses direct Supabase PostgREST API with relational enrichment:
  mplads_new_projects
    ├── cost_details_id -> mplads_cost_details (sanctioned, utilized)
    └── risk_id -> mplads_risk_scores (risk_score, risk_level)
"""

from __future__ import annotations
import asyncio
import logging
from typing import List, Optional, Dict

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def _supabase_query(table: str, params: dict) -> list[dict]:
    """Query Supabase REST API."""
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase not configured — project lookup unavailable")
        return []

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/{table}"
    headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()


async def _enrich_projects_with_costs_and_risks(projects: list[dict]) -> list[dict]:
    """Enrich raw projects by fetching related costs and risk records."""
    if not projects:
        return []

    cost_ids = [p["cost_details_id"] for p in projects if p.get("cost_details_id")]
    risk_ids = [p["risk_id"] for p in projects if p.get("risk_id")]

    cost_map: Dict[int, dict] = {}
    risk_map: Dict[int, dict] = {}

    async def fetch_costs():
        if not cost_ids:
            return
        params = {"id": f"in.({','.join(str(cid) for cid in cost_ids)})", "select": "*"}
        try:
            rows = await _supabase_query("mplads_cost_details", params)
            for r in rows:
                cost_map[r["id"]] = r
        except Exception as e:
            logger.warning("Failed to fetch cost details: %s", e)

    async def fetch_risks():
        if not risk_ids:
            return
        params = {"id": f"in.({','.join(str(rid) for rid in risk_ids)})", "select": "*"}
        try:
            rows = await _supabase_query("mplads_risk_scores", params)
            for r in rows:
                risk_map[r["id"]] = r
        except Exception as e:
            logger.warning("Failed to fetch risk details: %s", e)

    await asyncio.gather(fetch_costs(), fetch_risks())

    enriched = []
    for p in projects:
        cost = cost_map.get(p.get("cost_details_id"), {})
        risk = risk_map.get(p.get("risk_id"), {})
        enriched.append({
            **p,
            "project_name": p.get("project_title") or p.get("project_name", "Untitled"),
            "estimated_cost": cost.get("estimated_cost", 0.0),
            "sanctioned_amount": cost.get("sanctioned_amount", 0.0),
            "utilized_amount": cost.get("utilized_amount", 0.0),
            "unspent_balance": cost.get("unspent_balance", 0.0),
            "risk_score": risk.get("risk_score", 0.0),
            "risk_level": risk.get("risk_level", "LOW"),
        })

    return enriched


async def lookup_mp_projects(
    mp_id: int,
    status_filter: str | None = None,
    risk_level: str | None = None,
    category: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Query the main platform for the MP's projects with cost & risk data."""
    params = {
        "mp_id": f"eq.{mp_id}",
        "select": "*",
        "limit": str(limit),
        "order": "created_at.desc",
    }

    if status_filter:
        params["status"] = f"eq.{status_filter.upper()}"
    if category:
        params["category"] = f"eq.{category.upper()}"

    try:
        raw_projects = await _supabase_query("mplads_new_projects", params)
        enriched = await _enrich_projects_with_costs_and_risks(raw_projects)

        if risk_level:
            enriched = [p for p in enriched if (p.get("risk_level") or "").upper() == risk_level.upper()]

        logger.info("Fetched %d enriched projects for MP %d", len(enriched), mp_id)
        return enriched
    except Exception as e:
        logger.error("Project lookup failed for MP %d: %s", mp_id, e)
        return []


async def get_mp_dashboard_summary(mp_id: int) -> dict:
    """Get aggregated dashboard statistics for an MP."""
    try:
        projects = await lookup_mp_projects(mp_id, limit=500)

        if not projects:
            return {
                "total_projects": 0,
                "active_count": 0,
                "completed_count": 0,
                "high_risk_count": 0,
                "total_funds": 0,
                "utilized_funds": 0,
            }

        active = [p for p in projects if p.get("status") in ("ONGOING", "IN_PROGRESS", "APPROVED", "SANCTIONED", "ongoing", "in_progress", "active")]
        completed = [p for p in projects if p.get("status") in ("COMPLETED", "completed", "done")]
        high_risk = [p for p in projects if (p.get("risk_level") or "").upper() in ("HIGH", "CRITICAL")]

        total_funds = sum(float(p.get("sanctioned_amount") or 0) for p in projects)
        utilized_funds = sum(float(p.get("utilized_amount") or 0) for p in projects)

        return {
            "total_projects": len(projects),
            "active_count": len(active),
            "completed_count": len(completed),
            "high_risk_count": len(high_risk),
            "total_funds": total_funds,
            "utilized_funds": utilized_funds,
        }

    except Exception as e:
        logger.error("Dashboard summary failed for MP %d: %s", mp_id, e)
        return {"error": str(e)}


async def get_project_details(project_id: int, mp_id: int) -> dict | None:
    """Get detailed info for a specific project (with MP ownership check)."""
    params = {
        "id": f"eq.{project_id}",
        "mp_id": f"eq.{mp_id}",
        "select": "*",
        "limit": "1",
    }

    try:
        results = await _supabase_query("mplads_new_projects", params)
        if not results:
            logger.warning("Project %d not found for MP %d", project_id, mp_id)
            return None
        enriched = await _enrich_projects_with_costs_and_risks(results)
        return enriched[0] if enriched else None
    except Exception as e:
        logger.error("Project detail lookup failed: %s", e)
        return None


def format_projects_for_context(projects: list[dict]) -> str:
    """Format project data as text context for the LLM."""
    if not projects:
        return "No project data available."

    lines = [f"MP's Project Data ({len(projects)} projects):", ""]

    for i, p in enumerate(projects[:20], 1):
        lines.append(f"Project {i}: {p.get('project_name', 'N/A')}")
        lines.append(f"  Status: {p.get('status', 'N/A')}")
        lines.append(f"  Category: {p.get('category', 'N/A')}")
        lines.append(f"  Location: {p.get('district', 'N/A')}, {p.get('state', 'N/A')}")
        lines.append(f"  Sanctioned: ₹{p.get('sanctioned_amount', 0):,.2f}")
        lines.append(f"  Utilized: ₹{p.get('utilized_amount', 0):,.2f}")
        lines.append(f"  Unspent: ₹{p.get('unspent_balance', 0):,.2f}")
        if p.get("risk_level"):
            lines.append(f"  Risk Level: {p.get('risk_level')} (Score: {p.get('risk_score', 0)})")
        lines.append("")

    return "\n".join(lines)
