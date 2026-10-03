from collections import defaultdict
from typing import Optional
from datetime import datetime
from database.database import supabase

async def reports(mp: dict, year: Optional[int] = None):
    """
    Fetches data for the Reports & Analytics page.
    Aggregates projects by category and calculates cumulative fund utilization over time.
    """
    mp_id = mp["id"]

    proj_response = (
        supabase
        .table("mplads_new_projects")
        .select("id, category, status, sanctioned_amount, utilized_amount, start_date, created_at")
        .eq("mp_id", mp_id)
        .execute()
    )
    projects = proj_response.data or []

    by_category = defaultdict(lambda: {"completed": 0, "ongoing": 0})
    
    for p in projects:
        raw_cat = p.get("category") or "Other"
        cat = raw_cat.replace("_", " ").title()
        
        if p.get("status") and p["status"].upper() == "COMPLETED":
            by_category[cat]["completed"] += 1
        else:
            by_category[cat]["ongoing"] += 1

    project_ids = [p["id"] for p in projects]
    monthly_data = defaultdict(lambda: {"sanctioned": 0.0, "utilized": 0.0})
    
    if project_ids:
        trans_query = (
            supabase
            .table("mplads_fund_transactions")
            .select("amount, transaction_type, transaction_date")
            .in_("project_id", project_ids)
        )

        if year:
            trans_query = trans_query.gte("transaction_date", f"{year}-04-01").lte("transaction_date", f"{year+1}-03-31")
            
        trans_response = trans_query.execute()
        transactions = trans_response.data or []
        
        if transactions:
            for t in transactions:
                if not t.get("transaction_date"): 
                    continue
                    
                month = t["transaction_date"][:7] 
                amount_in_lakhs = (t.get("amount") or 0) / 1e5 
                
                t_type = t.get("transaction_type", "").upper()
                if t_type == "SANCTION":
                    monthly_data[month]["sanctioned"] += amount_in_lakhs
                elif t_type in ("UTILIZATION", "UTILISED", "RELEASE"):
                    monthly_data[month]["utilized"] += amount_in_lakhs
        else:
            for p in projects:
                if p.get("start_date") and p.get("sanctioned_amount"):
                    month = p["start_date"][:7]
                    monthly_data[month]["sanctioned"] += (p["sanctioned_amount"] or 0) / 1e5
                if p.get("created_at") and p.get("utilized_amount"):
                    month = p["created_at"][:7]
                    monthly_data[month]["utilized"] += (p["utilized_amount"] or 0) / 1e5

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
            "utilized": round(running_utilized, 2)
        })

    return {
        "by_category": [
            {"category": k, **v} for k, v in by_category.items()
        ],
        "cumulative_utilization": cumulative,
    }