"""
run_pipeline.py
===============
Unified MPLADS fraud-detection pipeline.

Input  : JSON from the frontend (via stdin, file, or direct dict).
Output : JSON containing per-MP composite risk scores + SHAP explanations.

Intermediate engine outputs are saved as CSVs in --output_dir for reference.

Usage:
    python run_pipeline.py --input input.json --output_dir ./pipeline_run
    python run_pipeline.py --input input.json --output output.json
    cat input.json | python run_pipeline.py --output_dir ./pipeline_run
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import pickle
from datetime import datetime

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Logging helper
# ---------------------------------------------------------------------------
def log(msg):
    print(f"\n=== [{datetime.now():%H:%M:%S}] {msg} ===", flush=True)


# ---------------------------------------------------------------------------
# Engine 1: Cost Anomaly Detector
# ---------------------------------------------------------------------------
def run_cost_anomaly(works_df: pd.DataFrame, output_csv: str) -> pd.DataFrame:
    log(f"Engine 1 / Cost Anomaly Detector  ({len(works_df)} works)")
    from cost_anomaly_detector import run_cost_anomaly_engine

    # Save the works DataFrame to a temp CSV and run the engine
    temp_input = output_csv.replace(".csv", "_temp_input.csv")
    works_df.to_csv(temp_input, index=False)
    result_df = run_cost_anomaly_engine(temp_input, output_csv)

    # Cleanup temp file
    if os.path.exists(temp_input):
        os.remove(temp_input)

    return result_df


# ---------------------------------------------------------------------------
# Engine 4: Duplicate/Ghost Work Detector
# ---------------------------------------------------------------------------
def run_duplicate_ghost(works_df: pd.DataFrame, output_csv: str) -> pd.DataFrame:
    log(f"Engine 4 / Duplicate-Ghost Work Detector  ({len(works_df)} works)")
    from duplicate_ghost_work_detector import DuplicateGhostWorkDetector, combine_outputs

    # Prepare the subset of columns needed by this engine
    dup_cols = ["work_id", "description", "latitude", "longitude", "cost", "sanction_date"]
    df = works_df[dup_cols].copy()
    df["sanction_date"] = pd.to_datetime(df["sanction_date"])

    detector = DuplicateGhostWorkDetector()
    work_features, pair_evidence = detector.fit_predict(df)
    combined = combine_outputs(work_features, pair_evidence)
    combined.to_csv(output_csv, index=False)
    print(f"Saved -> {output_csv}  (rows={len(combined)}, flagged={int(combined['is_duplicate_flagged'].sum())})")
    return combined


# ---------------------------------------------------------------------------
# Engine 2: Vendor Collusion Network Detector
# ---------------------------------------------------------------------------
def run_vendor_collusion(
    expenditure_df: pd.DataFrame,
    registry_df: pd.DataFrame,
    output_csv: str,
    output_pkl: str,
) -> pd.DataFrame:
    log(f"Engine 2 / Vendor Collusion Network  ({expenditure_df['Vendor'].nunique()} vendors)")
    from vendor_collusion_network_detector import VendorCollusionNetworkDetector

    detector = VendorCollusionNetworkDetector()
    vendor_features = detector.fit_predict(expenditure_df, registry_df)
    vendor_features.to_csv(output_csv, index=False)
    with open(output_pkl, "wb") as f:
        pickle.dump(detector, f)
    print(f"Saved -> {output_csv}  (rows={len(vendor_features)}, "
          f"flagged={int(vendor_features['is_flagged_collusion'].sum())})")
    return vendor_features


# ---------------------------------------------------------------------------
# Engine 3: Fund Utilization Forecaster
# ---------------------------------------------------------------------------
def run_fund_utilization(
    expenditure_df: pd.DataFrame,
    output_csv: str,
    models_pkl: str,
    group_col: str = "MP Name",
) -> pd.DataFrame:
    log(f"Engine 3 / Fund Utilization Forecaster  ({expenditure_df[group_col].nunique()} MPs)")
    from fund_utilization_forecaster import FundUtilizationForecaster, FundUtilizationConfig

    cfg = FundUtilizationConfig(group_col=group_col)
    forecaster = FundUtilizationForecaster(config=cfg)
    result = forecaster.fit_predict(expenditure_df)
    result.to_csv(output_csv, index=False)
    forecaster.save_models(models_pkl)
    print(f"Saved -> {output_csv}  (rows={len(result)}, "
          f"flagged={int(result['is_deviation_flagged'].sum())})")
    return result


# ---------------------------------------------------------------------------
# Build features (aggregate 4 engine outputs -> MP-level feature matrix)
# ---------------------------------------------------------------------------
def run_build_features(
    engine1_csv: str,
    engine4_csv: str,
    engine3_csv: str,
    engine2_csv: str,
    output_csv: str,
) -> pd.DataFrame:
    log(f"Build Features  (4 engine outputs -> {output_csv})")
    from build_features import build_features
    return build_features(engine1_csv, engine4_csv, engine3_csv, engine2_csv, output_csv)


# ---------------------------------------------------------------------------
# Composite Risk Model (XGBoost + Optuna + SHAP)
# ---------------------------------------------------------------------------
def run_composite_model(mp_features_csv: str, intermediates_dir: str) -> dict:
    log(f"Composite Risk Model (XGBoost + Optuna + SHAP)  ({mp_features_csv})")
    import composite_risk_model as crm

    crm.CONFIG["features_csv"] = mp_features_csv
    crm.CONFIG["output_dir"] = intermediates_dir
    crm.main(crm.CONFIG)

    # Read and return the final JSON output
    json_path = os.path.join(intermediates_dir, "composite_risk_output.json")
    with open(json_path, "r") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Enrich Final JSON with Detailed Flags for Frontend
# ---------------------------------------------------------------------------
def enrich_json_with_details(final_json: dict, intermediates_dir: str) -> dict:
    """Attaches ALL work-level, vendor-level, and month-level details from
    every engine into the final JSON. The frontend decides what to display."""
    log("Enriching final JSON with full engine details for frontend")

    e1 = pd.read_csv(os.path.join(intermediates_dir, "engine1_output.csv"))
    e4 = pd.read_csv(os.path.join(intermediates_dir, "engine4_output.csv"))
    e2 = pd.read_csv(os.path.join(intermediates_dir, "engine2_output.csv"))
    e3 = pd.read_csv(os.path.join(intermediates_dir, "engine3_output.csv"))

    # Map Work ID in e4 to MP Name via e1
    e4_merged = e4.rename(columns={"work_id": "Work ID"}).merge(
        e1[["Work ID", "MP Name"]], on="Work ID", how="inner"
    )

    # Group ALL records by MP (not just flagged ones)
    e1_by_mp = e1.groupby("MP Name")
    e4_by_mp = e4_merged.groupby("MP Name")
    vendor_group_col = "primary_mp" if "primary_mp" in e2.columns else "MP Name"
    e2_by_mp = e2.groupby(vendor_group_col)
    e3_by_mp = e3.groupby("MP Name")

    def clean_records(df):
        """Convert DataFrame rows to JSON-safe dicts with all columns."""
        return df.replace({pd.NA: None, np.nan: None}).to_dict(orient="records")

    for mp in final_json.get("mps", []):
        mp_name = mp["mp_name"]

        # Engine 1: Cost Anomaly — ALL columns, ALL works for this MP
        mp["cost_anomaly_details"] = []
        if mp_name in e1_by_mp.groups:
            mp["cost_anomaly_details"] = clean_records(e1_by_mp.get_group(mp_name))

        # Engine 4: Duplicate/Ghost — ALL columns, ALL works for this MP
        mp["duplicate_ghost_details"] = []
        if mp_name in e4_by_mp.groups:
            mp["duplicate_ghost_details"] = clean_records(e4_by_mp.get_group(mp_name))

        # Engine 2: Vendor Collusion — ALL columns, ALL vendors for this MP
        mp["vendor_collusion_details"] = []
        if mp_name in e2_by_mp.groups:
            mp["vendor_collusion_details"] = clean_records(e2_by_mp.get_group(mp_name))

        # Engine 3: Fund Utilization — ALL columns, ALL months for this MP
        mp["fund_utilization_details"] = []
        if mp_name in e3_by_mp.groups:
            mp["fund_utilization_details"] = clean_records(e3_by_mp.get_group(mp_name))

    return final_json


# ---------------------------------------------------------------------------
# Main pipeline orchestrator
# ---------------------------------------------------------------------------
def run_pipeline_from_json(input_json: dict, output_dir: str = "./pipeline_run") -> dict:
    """
    Run the full 5-engine pipeline from a frontend JSON input.

    Parameters
    ----------
    input_json : dict
        Must have a "works" key with a list of work entries.
        See feature_generator.py for the expected schema.
    output_dir : str
        Directory to save intermediate CSVs and final output.

    Returns
    -------
    dict : The final composite risk JSON output.
    """
    from feature_generator import process_input_json

    os.makedirs(output_dir, exist_ok=True)
    intermediates_dir = os.path.join(output_dir, "intermediates")
    os.makedirs(intermediates_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # Step 0: Generate all derived features from the raw user input
    # ------------------------------------------------------------------
    log("Step 0: Generating features from user input JSON")
    data = process_input_json(input_json, registry_path="vendor_registry.csv")
    works_df = data["works_df"]
    expenditure_df = data["expenditure_df"]
    registry_df = data["registry_df"]

    # Save the enriched input for reference
    works_df.to_csv(os.path.join(intermediates_dir, "input_works_enriched.csv"), index=False)
    expenditure_df.to_csv(os.path.join(intermediates_dir, "input_expenditures_enriched.csv"), index=False)

    # ------------------------------------------------------------------
    # Step 1: Run the 4 base ML engines
    # ------------------------------------------------------------------
    engine1_out = os.path.join(intermediates_dir, "engine1_output.csv")
    engine4_out = os.path.join(intermediates_dir, "engine4_output.csv")
    engine2_out = os.path.join(intermediates_dir, "engine2_output.csv")
    engine2_pkl = os.path.join(intermediates_dir, "engine2_detector.pkl")
    engine3_out = os.path.join(intermediates_dir, "engine3_output.csv")
    engine3_pkl = os.path.join(intermediates_dir, "engine3_models.pkl")
    features_out = os.path.join(intermediates_dir, "mp_composite_features.csv")

    # Engine 1: Cost Anomaly
    run_cost_anomaly(works_df, engine1_out)

    # Engine 4: Duplicate/Ghost Work
    run_duplicate_ghost(works_df, engine4_out)

    # Engine 2: Vendor Collusion
    run_vendor_collusion(expenditure_df, registry_df, engine2_out, engine2_pkl)

    # Engine 3: Fund Utilization
    run_fund_utilization(expenditure_df, engine3_out, engine3_pkl)

    # ------------------------------------------------------------------
    # Step 2: Aggregate engine outputs -> MP-level features
    # ------------------------------------------------------------------
    run_build_features(engine1_out, engine4_out, engine3_out, engine2_out, features_out)

    # ------------------------------------------------------------------
    # Step 3: Run the Composite Risk Model
    # ------------------------------------------------------------------
    final_output = run_composite_model(features_out, intermediates_dir)

    # ------------------------------------------------------------------
    # Step 4: Embed drill-down details (works/vendors/months) into JSON
    # ------------------------------------------------------------------
    final_output = enrich_json_with_details(final_output, intermediates_dir)

    log(f"Pipeline complete. Output dir: {output_dir}")
    return final_output


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
def main():
    p = argparse.ArgumentParser(
        description="MPLADS fraud detection pipeline — JSON in, JSON out"
    )
    p.add_argument(
        "--input", "-i",
        help="Path to input JSON file. If omitted, reads from stdin.",
    )
    p.add_argument(
        "--output", "-o",
        help="Path to write the final output JSON. "
             "If omitted, prints to stdout and saves in output_dir.",
    )
    p.add_argument(
        "--output_dir", "-d",
        default="./pipeline_run",
        help="Directory for intermediate CSVs and outputs (default: ./pipeline_run).",
    )
    args = p.parse_args()

    # Load input JSON
    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            input_json = json.load(f)
    else:
        input_json = json.load(sys.stdin)

    # Run pipeline
    final_output = run_pipeline_from_json(input_json, args.output_dir)

    # Write output
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(final_output, f, indent=2, default=str)
        log(f"Final output written to {args.output}")
    else:
        # Also always save in output_dir
        out_path = os.path.join(args.output_dir, "composite_risk_output.json")
        print(f"\nFinal output saved to: {out_path}")


if __name__ == "__main__":
    main()
