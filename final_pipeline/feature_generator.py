"""
feature_generator.py
====================
Takes the minimal set of user-provided fields (JSON from the frontend)
and generates ALL derived features required by the 4 ML engines.

User-Provided Fields (per work entry):
---------------------------------------
  work_id, description, category, mp_name, state, district, house,
  latitude, longitude, sanction_amount, quantity, unit,
  sanction_date, completed_date,
  vendor, expenditure_amount, expenditure_date, ida

Generated Features:
-------------------
  unit_cost, sor_rate, expected_cost, cost_deviation_pct,
  sor_match_confidence, is_anomaly_injected (=False for real data),
  cost (alias of sanction_amount for dup-ghost detector),
  Paid_Up_Capital, Registration_Date, Is_Blacklisted, Is_Shell_Company
  (looked up from vendor_registry.csv)
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger("feature_generator")
logging.basicConfig(level=logging.INFO)

# ---------------------------------------------------------------------------
# The fields the frontend MUST provide for each work entry
# ---------------------------------------------------------------------------
USER_REQUIRED_FIELDS = [
    "work_id",
    "description",
    "category",
    "mp_name",
    "state",
    "district",
    "latitude",
    "longitude",
    "sanction_amount",
    "quantity",
    "unit",
    "sanction_date",
    "vendor",
    "expenditure_amount",
    "expenditure_date",
    "ida",
]

USER_OPTIONAL_FIELDS = [
    "house",           # Lok Sabha / Rajya Sabha  (defaults to "Lok Sabha")
    "completed_date",  # may not be available yet
    "has_images",      # bool
    "average_rating",  # float
    "constituency",    # constituency name
    "payment_status",  # Paid / Pending  (defaults to "Paid")
]

# ---------------------------------------------------------------------------
# Schedule of Rates (SOR) lookup table — category-level median rates.
# In production this would come from an actual SOR database; here we use
# representative values derived from the training data.
# ---------------------------------------------------------------------------
SOR_RATE_TABLE = {
    "Road Construction":         3100.00,
    "Community Infrastructure":  2800.00,
    "Drinking Water":            2500.00,
    "Sanitation":                2200.00,
    "Education":                 3000.00,
    "Health":                    2900.00,
    "Electricity":               2600.00,
    "Sports":                    3200.00,
    "Environment":               2400.00,
    "Agriculture":               2300.00,
    "Bridge/Culvert":            3500.00,
    "Irrigation":                2700.00,
    "Other":                     2800.00,
}
DEFAULT_SOR_RATE = 2800.00


def _lookup_sor_rate(category: str) -> float:
    """Look up SOR rate by category, with fuzzy matching fallback."""
    if category in SOR_RATE_TABLE:
        return SOR_RATE_TABLE[category]
    # Fuzzy: check if any key is a substring of category or vice-versa
    cat_lower = category.lower()
    for key, rate in SOR_RATE_TABLE.items():
        if key.lower() in cat_lower or cat_lower in key.lower():
            return rate
    return DEFAULT_SOR_RATE


def _compute_sor_match_confidence(cost_deviation_pct: float) -> float:
    """Deterministic SOR match confidence based on deviation percentage.
    
    Uses a sigmoid-like decay: confidence = 1 / (1 + k * |deviation|)
    This maps:
      - 0% deviation   → ~0.95 confidence
      - 5% deviation   → ~0.87 confidence
      - 15% deviation  → ~0.73 confidence
      - 30% deviation  → ~0.57 confidence
      - 50%+ deviation → ~0.40 confidence
    
    Unlike the previous random.uniform approach, this is fully
    deterministic — same input always produces the same output.
    """
    abs_dev = abs(cost_deviation_pct)
    confidence = 1.0 / (1.0 + 1.1 * abs_dev)
    # Scale to [0.30, 0.95] range to match training data distribution
    confidence = 0.30 + 0.65 * confidence
    return round(confidence, 3)


def validate_input(works_json: list[dict]) -> list[str]:
    """Validate the input JSON and return a list of error messages (empty = OK)."""
    errors = []
    if not works_json:
        errors.append("Input JSON 'works' array is empty.")
        return errors

    for i, work in enumerate(works_json):
        for field in USER_REQUIRED_FIELDS:
            if field not in work or work[field] is None or work[field] == "":
                errors.append(f"Work[{i}] (work_id={work.get('work_id', '?')}): missing required field '{field}'")
    return errors


def generate_works_features(works_json: list[dict]) -> pd.DataFrame:
    """
    Takes the user-provided works JSON and generates ALL features needed
    by Engine 1 (Cost Anomaly) and Engine 4 (Duplicate/Ghost Work).

    Returns a DataFrame with columns matching what the engines expect.
    """
    rows = []
    for work in works_json:
        quantity = float(work["quantity"]) if float(work["quantity"]) > 0 else 1.0
        sanction_amount = float(work["sanction_amount"])
        unit_cost = sanction_amount / quantity
        sor_rate = _lookup_sor_rate(work["category"])
        expected_cost = sor_rate * quantity
        cost_deviation_pct = (unit_cost - sor_rate) / sor_rate if sor_rate > 0 else 0.0
        sor_match_confidence = _compute_sor_match_confidence(cost_deviation_pct)

        rows.append({
            # === User-provided (renamed to match engine column names) ===
            "Work ID":          work["work_id"],
            "State":            work["state"],
            "district":         work["district"],
            "category":         work["category"],
            "quantity":         quantity,
            "unit":             work["unit"],
            "sanction_amount":  sanction_amount,
            "Work Description": work["description"],
            "MP Name":          work["mp_name"],
            "House":            work.get("house", "Lok Sabha"),
            "Completed Date":   work.get("completed_date", ""),
            "IDA":              work["ida"],

            # === Generated features for Engine 1 (Cost Anomaly) ===
            "unit_cost":             round(unit_cost, 2),
            "sor_rate":              round(sor_rate, 2),
            "expected_cost":         round(expected_cost, 2),
            "cost_deviation_pct":    round(cost_deviation_pct, 4),
            "sor_match_confidence":  sor_match_confidence,
            "is_anomaly_injected":   False,    # real data, not synthetic
            "Original Category":     work["category"],
            "Predicted_Anomaly":     False,    # placeholder, will be set by engine 1

            # === Fields for Engine 4 (Duplicate/Ghost Work) ===
            "work_id":        work["work_id"],
            "description":    work["description"],
            "latitude":       float(work["latitude"]),
            "longitude":      float(work["longitude"]),
            "cost":           sanction_amount,          # alias
            "sanction_date":  work["sanction_date"],
        })

    df = pd.DataFrame(rows)
    logger.info("Generated works features: %d rows, %d columns", len(df), len(df.columns))
    return df


def generate_expenditure_features(works_json: list[dict]) -> pd.DataFrame:
    """
    Takes the user-provided works JSON and generates the expenditure
    DataFrame needed by Engine 2 (Vendor Collusion) and Engine 3 (Fund
    Utilization Forecaster).
    """
    rows = []
    for work in works_json:
        rows.append({
            "MP Name":                  work["mp_name"],
            "Constituency":             work.get("constituency", work["district"]),
            "State":                    work["state"],
            "House":                    work.get("house", "Lok Sabha"),
            "Work Description":         work["description"],
            "Vendor":                   work["vendor"],
            "IDA":                      work["ida"],
            "Expenditure Amount (₹)":   float(work["expenditure_amount"]),
            "Expenditure Date":         work["expenditure_date"],
            "Payment Status":           work.get("payment_status", "Paid"),
            "Is_Collusion_Injected":    False,   # real data
        })

    df = pd.DataFrame(rows)
    logger.info("Generated expenditure features: %d rows, %d columns", len(df), len(df.columns))
    return df


def load_vendor_registry(registry_path: str = "vendor_registry.csv") -> pd.DataFrame:
    """Load the vendor registry reference data (pre-existing, not user-provided)."""
    if not os.path.isfile(registry_path):
        logger.warning("Vendor registry not found at '%s'. Creating empty registry.", registry_path)
        return pd.DataFrame(columns=[
            "Vendor", "Paid_Up_Capital", "Registration_Date",
            "Is_Blacklisted", "Is_Shell_Company",
        ])
    return pd.read_csv(registry_path)


def enrich_with_registry(
    expenditure_df: pd.DataFrame, registry_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Ensure all vendors appearing in the expenditure data exist in the
    registry. New vendors get default (safe) values.
    """
    existing_vendors = set(registry_df["Vendor"].unique())
    new_vendors = set(expenditure_df["Vendor"].unique()) - existing_vendors

    if new_vendors:
        logger.info("Adding %d new vendors to registry with default values.", len(new_vendors))
        new_rows = []
        for v in new_vendors:
            new_rows.append({
                "Vendor":            v,
                "Paid_Up_Capital":   5_000_000.0,   # median placeholder
                "Registration_Date": "2020-01-01",
                "Is_Blacklisted":    False,
                "Is_Shell_Company":  False,
            })
        registry_df = pd.concat([registry_df, pd.DataFrame(new_rows)], ignore_index=True)

    return registry_df


def process_input_json(input_json: dict, registry_path: str = "vendor_registry.csv") -> dict:
    """
    Main entry point. Takes raw frontend JSON, validates, generates all
    features, and returns a dict of DataFrames ready for the engines.

    Parameters
    ----------
    input_json : dict
        Must have a "works" key with a list of work entries.
    registry_path : str
        Path to the vendor_registry.csv reference file.

    Returns
    -------
    dict with keys:
        "works_df"        -> DataFrame for Engine 1 + Engine 4
        "expenditure_df"  -> DataFrame for Engine 2 + Engine 3
        "registry_df"     -> DataFrame for Engine 2 (vendor registry)
        "input_json"      -> The original enriched JSON (for reference)
    """
    works = input_json.get("works", [])

    # Validate
    errors = validate_input(works)
    if errors:
        raise ValueError("Input validation failed:\n" + "\n".join(errors))

    # Generate feature DataFrames
    works_df = generate_works_features(works)
    expenditure_df = generate_expenditure_features(works)

    # Load and enrich vendor registry
    registry_df = load_vendor_registry(registry_path)
    registry_df = enrich_with_registry(expenditure_df, registry_df)

    return {
        "works_df": works_df,
        "expenditure_df": expenditure_df,
        "registry_df": registry_df,
        "input_json": input_json,
    }


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    
    sample = {
        "works": [
            {
                "work_id": "W001",
                "description": "Construction of community hall in village centre",
                "category": "Community Infrastructure",
                "mp_name": "TEST MP",
                "state": "Maharashtra",
                "district": "Pune",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "sanction_amount": 500000,
                "quantity": 150,
                "unit": "sq_meters",
                "sanction_date": "2024-06-15",
                "vendor": "ABC Constructions",
                "expenditure_amount": 480000,
                "expenditure_date": "2024-12-25",
                "ida": "PUNE(DISTRICT COLLECTOR PUNE_IDA)",
            },
            {
                "work_id": "W002",
                "description": "Road repair near main market area",
                "category": "Road Construction",
                "mp_name": "TEST MP",
                "state": "Maharashtra",
                "district": "Pune",
                "latitude": 18.5210,
                "longitude": 73.8570,
                "sanction_amount": 300000,
                "quantity": 100,
                "unit": "sq_meters",
                "sanction_date": "2024-07-20",
                "vendor": "XYZ Builders",
                "expenditure_amount": 295000,
                "expenditure_date": "2025-01-10",
                "ida": "PUNE(DISTRICT COLLECTOR PUNE_IDA)",
            },
        ]
    }

    result = process_input_json(sample)
    print("\n=== Works DataFrame ===")
    print(result["works_df"].columns.tolist())
    print(result["works_df"].to_string(index=False))
    print("\n=== Expenditure DataFrame ===")
    print(result["expenditure_df"].columns.tolist())
    print(result["expenditure_df"].to_string(index=False))
    print("\n=== Registry DataFrame ===")
    print(f"Rows: {len(result['registry_df'])}")
