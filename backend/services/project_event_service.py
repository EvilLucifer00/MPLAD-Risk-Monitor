from typing import Optional

from database.database import supabase


async def create_project_event(
    *,
    project_id: int,
    event_type: str,
    title: str,
    message: str,
    actor_role: Optional[str] = None,
    actor_id: Optional[int] = None,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
    risk_score: Optional[float] = None,
    risk_level: Optional[str] = None,
    metadata: Optional[dict] = None,
):
    data = {
        "project_id": project_id,
        "event_type": event_type,
        "title": title,
        "message": message,
        "actor_role": actor_role,
        "actor_id": actor_id,
        "old_status": old_status,
        "new_status": new_status,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "metadata": metadata or {},
    }

    response = (
        supabase
        .table("mplads_project_events")
        .insert(data)
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise RuntimeError("Failed to create project event")

    return rows[0]