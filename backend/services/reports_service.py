from collections import defaultdict
from typing import Optional
from datetime import datetime
from database.database import supabase


async def reports(mp: dict, year: Optional[int] = None):
    
    mp_id = mp["id"]

    proj_response = (
        supabase
        .table("mplads_new_projects")
        .select("id, category, status, start_date, created_at, cost_details_id")
        .eq("mp_id", mp_id)
        .execute()
    )
    projects = proj_response.data or []

    # ------------------------------------------------------------------
    # 1. Category breakdown
    # ------------------------------------------------------------------
    by_category = defaultdict(lambda: {"completed": 0, "ongoing": 0})

    for p in projects:
        raw_cat = p.get("category") or "Other"
        cat = raw_cat.replace("_", " ").title()

        if p.get("status") and p["status"].upper() == "COMPLETED":
            by_category[cat]["completed"] += 1
        else:
            by_category[cat]["ongoing"] += 1

    # ------------------------------------------------------------------
    # 2. Fetch cost details for all projects
    # ------------------------------------------------------------------
    cost_ids = list({p.get("cost_details_id") for p in projects if p.get("cost_details_id")})
    cost_map = {}

    if cost_ids:
        cost_resp = (
            supabase
            .table("mplads_cost_details")
            .select("id, estimated_cost, sanctioned_amount, utilized_amount, unspent_balance")
            .in_("id", cost_ids)
            .execute()
        )
        cost_map = {c["id"]: c for c in (cost_resp.data or [])}

    # ------------------------------------------------------------------
    # 3. Build monthly sanctioned / utilized series (in lakhs)
    # ------------------------------------------------------------------
    monthly_data = defaultdict(lambda: {"sanctioned": 0.0, "utilized": 0.0})

    for p in projects:
        cost = cost_map.get(p.get("cost_details_id"))
        if not cost:
            continue

        # ---- sanctioned side: use start_date month ----
        sanctioned = cost.get("sanctioned_amount") or 0
        start_date = p.get("start_date")
        if start_date and sanctioned:
            month = str(start_date)[:7]
            if _in_year_window(month, year):
                monthly_data[month]["sanctioned"] += sanctioned / 1e5

        # ---- utilized side: use created_at month ----
        utilized = cost.get("utilized_amount") or 0
        created_at = p.get("created_at")
        if created_at and utilized:
            month = str(created_at)[:7]
            if _in_year_window(month, year):
                monthly_data[month]["utilized"] += utilized / 1e5

    # ------------------------------------------------------------------
    # 4. Cumulative series
    # ------------------------------------------------------------------
    sorted_months = sorted(monthly_data.keys())
    cumulative = []
    running_sanctioned = 0.0
    running_utilized = 0.0

    for month in sorted_months:
        running_sanctioned += monthly_data[month]["sanctioned"]
        running_utilized += monthly_data[month]["utilized"]

        cumulative.append({
            "month": month,
            "sanctioned": round(running_sanctioned, 2),
            "utilized": round(running_utilized, 2),
        })

    return {
        "by_category": [
            {"category": k, **v} for k, v in by_category.items()
        ],
        "cumulative_utilization": cumulative,
    }


def _in_year_window(month_str: str, year: Optional[int]) -> bool:
    
    if not year:
        return True
    try:
        y, m = map(int, month_str.split("-"))
    except (ValueError, AttributeError):
        return False

    if y == year and m >= 4:
        return True
    if y == year + 1 and m <= 3:
        return True
    return False