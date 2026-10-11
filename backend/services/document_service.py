from typing import Optional

from database.database import supabase


# For MP
async def get_docs_by_constituency(
    mp: dict,
    search: Optional[str] = None,
    upload_date: Optional[str] = None
):
    constituency = mp["constituency"].strip().upper()

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

    response = query.execute()

    return {
        "constituency": constituency,
        "data": response.data,
        "count": len(response.data)
    }


# For DM
async def get_docs_by_district(
    dm: dict,
    search: Optional[str] = None,
    upload_date: Optional[str] = None
):
    district = dm["dist"].strip().upper()

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

    response = query.execute()

    return {
        "district": district,
        "data": response.data,
        "count": len(response.data)
    }
