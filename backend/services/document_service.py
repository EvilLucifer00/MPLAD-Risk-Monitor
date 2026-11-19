from typing import Optional, Dict, Any

from database.database import supabase


# For MP
async def get_docs_by_constituency(
    mp: dict,
    search: Optional[str] = None,
    upload_date: Optional[str] = None,
) -> Dict[str, Any]:
    constituency = (mp.get("constituency") or "").strip()
    if not constituency:
        return {
            "constituency": None,
            "data": [],
            "count": 0,
        }

    query = (
        supabase
        .table("mplads_documents")
        .select("*")
        .eq("constituency", constituency)
    )

    # Search by file name / uploader
    if search:
        search = search.strip()
        query = query.or_(
            f"file_name.ilike.%{search}%,"
            f"uploaded_by.ilike.%{search}%"
        )

    # Filter by upload date
    if upload_date:
        query = query.eq("upload_date", upload_date)

    response = query.order("upload_date", desc=True).execute()
    data = response.data or []

    return {
        "constituency": constituency,
        "data": data,
        "count": len(data),
    }


# For DM
async def get_docs_by_district(
    dm: dict,
    search: Optional[str] = None,
    upload_date: Optional[str] = None,
) -> Dict[str, Any]:
    district = (dm.get("dist") or "").strip()
    if not district:
        return {
            "district": None,
            "data": [],
            "count": 0,
        }

    query = (
        supabase
        .table("mplads_documents")
        .select("*")
        .eq("district", district)
    )

    # Search by file name / uploader
    if search:
        search = search.strip()
        query = query.or_(
            f"file_name.ilike.%{search}%,"
            f"uploaded_by.ilike.%{search}%"
        )

    # Filter by upload date
    if upload_date:
        query = query.eq("upload_date", upload_date)

    response = query.order("upload_date", desc=True).execute()
    data = response.data or []

    return {
        "district": district,
        "data": data,
        "count": len(data),
    }