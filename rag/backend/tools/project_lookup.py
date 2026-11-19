"""Project lookup tool — queries the main platform database for MP/DM project data.

Available ONLY to authenticated MPs and DMs.
Uses direct PostgreSQL queries via the RAG database connection or
Supabase client if configured, falling back to direct SQL.
"""

from __future__ import annotations
import logging
from typing import List, Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def _supabase_query(table: str, params: dict) -> list[dict]:
    """Query Supabase REST API.

    Uses the PostgREST interface that Supabase exposes.
    """
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase not configured — project lookup unavailable")
        return []

    url = f"{settings.supabase_url}/rest/v1/{table}"
    headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()


async def lookup_mp_projects(
    mp_id: int,
    status_filter: str | None = None,
    risk_level: str | None = None,
    category: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Query the main platform for the MP's projects.

    Args:
        mp_id: The MP's ID from the JWT token.
        status_filter: Filter by project status (e.g., 'ongoing', 'completed').
        risk_level: Filter by risk level (e.g., 'high', 'medium', 'low').
        category: Filter by project category.
        limit: Max results to return.

    Returns:
        List of project dicts.
    """
    params = {
        "mp_id": f"eq.{mp_id}",
        "select": "*",
        "limit": str(limit),
        "order": "created_at.desc",
    }

    if status_filter:
        params["status"] = f"eq.{status_filter}"
    if risk_level:
        params["risk_level"] = f"eq.{risk_level}"
    if category:
        params["category"] = f"eq.{category}"

    try:
        projects = await _supabase_query("mplads_new_projects", params)
        logger.info("Fetched %d projects for MP %d", len(projects), mp_id)
        return projects
    except Exception as e:
        logger.error("Project lookup failed for MP %d: %s", mp_id, e)
        return []


async def get_mp_dashboard_summary(mp_id: int) -> dict:
    """Get aggregated dashboard statistics for an MP.

    Returns:
        Dict with total_projects, active_count, completed_count,
        high_risk_count, total_funds, utilized_funds.
    """
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

        active = [p for p in projects if p.get("status") in ("ongoing", "in_progress", "active")]
        completed = [p for p in projects if p.get("status") in ("completed", "done")]
        high_risk = [p for p in projects if p.get("risk_level") == "high"]

        total_funds = sum(float(p.get("sanctioned_amount", 0) or 0) for p in projects)
        utilized_funds = sum(float(p.get("utilized_amount", 0) or 0) for p in projects)

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
    """Get detailed info for a specific project (with MP ownership check).

    Args:
        project_id: The project ID.
        mp_id: The MP's ID (for ownership verification).

    Returns:
        Project dict or None if not found/unauthorized.
    """
    params = {
        "id": f"eq.{project_id}",
        "mp_id": f"eq.{mp_id}",
        "select": "*",
        "limit": "1",
    }

    try:
        results = await _supabase_query("mplads_new_projects", params)
        if results:
            return results[0]
        logger.warning("Project %d not found for MP %d", project_id, mp_id)
        return None
    except Exception as e:
        logger.error("Project detail lookup failed: %s", e)
        return None


def format_projects_for_context(projects: list[dict]) -> str:
    """Format project data as text context for the LLM.

    Converts structured project data into readable text that can be
    included in the LLM prompt alongside document context.
    """
    if not projects:
        return "No project data available."

    lines = [f"MP's Project Data ({len(projects)} projects):", ""]

    for i, p in enumerate(projects[:20], 1):  # Limit to prevent context overflow
        lines.append(f"Project {i}: {p.get('project_name', 'N/A')}")
        lines.append(f"  Status: {p.get('status', 'N/A')}")
        lines.append(f"  Category: {p.get('category', 'N/A')}")
        lines.append(f"  Location: {p.get('district', 'N/A')}, {p.get('state', 'N/A')}")
        lines.append(f"  Sanctioned: ₹{p.get('sanctioned_amount', 0):,.2f}")
        lines.append(f"  Utilized: ₹{p.get('utilized_amount', 0):,.2f}")
        if p.get("risk_level"):
            lines.append(f"  Risk Level: {p.get('risk_level')}")
        lines.append("")

    return "\n".join(lines)
