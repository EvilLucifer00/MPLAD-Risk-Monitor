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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
from schema.new_project_schema import ProjectSchema


# ---------------------------------------------------------------------------
# Logging helper
# ---------------------------------------------------------------------------
def log(msg):
    print(f"\n=== [{datetime.now():%H:%M:%S}] {msg} ===", flush=True)


# ---------------------------------------------------------------------------
# Engine 1: Cost Anomaly Detector  (INFERENCE MODE — uses pre-trained model)
# Detects statistically anomalous project costs given standard parameters.
# ---------------------------------------------------------------------------
def run_cost_anomaly(works_df: pd.DataFrame, output_csv: str, model_pkl: str = os.path.join(MODELS_DIR, "engine1_model.pkl")):
    log(f"Engine 1 / Cost Anomaly Detector  ({len(works_df)} works)  [inference]")

    # Load pre-trained model
    with open(model_pkl, "rb") as f:
        bundle = pickle.load(f)
    scaler = bundle["scaler"]
    iso_forest = bundle["iso_forest"]
    features = bundle["features"]

    df = works_df.copy()
    df = df.dropna(subset=features)
    X = df[features]
    X_scaled = scaler.transform(X)

    df["Anomaly_Label"] = iso_forest.predict(X_scaled)
    df["Anomaly_Score"] = iso_forest.decision_function(X_scaled)
    df["Predicted_Anomaly"] = df["Anomaly_Label"] == -1

    anomalies = df[df["Anomaly_Label"] == -1]
    print(f"  Anomalies flagged: {len(anomalies)} / {len(df)}")

    os.makedirs(os.path.dirname(output_csv) or ".", exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"  Saved -> {output_csv}")
    return df


# ---------------------------------------------------------------------------
# Engine 4: Duplicate/Ghost Work Detector
# Identifies projects that might be duplicates or fake based on geographic, text, and timing similarities.
# ---------------------------------------------------------------------------
def run_duplicate_ghost(works_df: pd.DataFrame, output_csv: str) -> pd.DataFrame:
    log(f"Engine 4 / Duplicate-Ghost Work Detector  ({len(works_df)} works)")
    from duplicate_ghost_work_detector import DuplicateGhostWorkDetector, combine_outputs

    # Prepare the subset of columns needed by this engine
    dup_cols = ["work_id", "description", "latitude", "longitude", "cost", "sanction_date"]
    df = pd.DataFrame(works_df[dup_cols].copy())
    df["sanction_date"] = pd.to_datetime(df["sanction_date"])

    detector = DuplicateGhostWorkDetector()
    work_features, pair_evidence = detector.fit_predict(df)
    combined = combine_outputs(work_features, pair_evidence)
    combined.to_csv(output_csv, index=False)
    print(f"Saved -> {output_csv}  (rows={len(combined)}, flagged={int(combined['is_duplicate_flagged'].sum())})")
    return combined


# ---------------------------------------------------------------------------
# Engine 2: Vendor Collusion Network Detector
# Analyzes vendor transaction networks to spot potential cartel or collusion rings.
# ---------------------------------------------------------------------------
def run_vendor_collusion(
    expenditure_df: pd.DataFrame,
    registry_df: pd.DataFrame,
    output_csv: str,
) -> pd.DataFrame:
    log(f"Engine 2 / Vendor Collusion Network  ({expenditure_df['Vendor'].nunique()} vendors)")
    from vendor_collusion_network_detector import VendorCollusionNetworkDetector

    detector = VendorCollusionNetworkDetector()
    vendor_features = detector.fit_predict(expenditure_df, registry_df)
    vendor_features.to_csv(output_csv, index=False)
    print(f"Saved -> {output_csv}  (rows={len(vendor_features)}, "
          f"flagged={int(vendor_features['is_flagged_collusion'].sum())})")
    return vendor_features


# ---------------------------------------------------------------------------
# Engine 3: Fund Utilization Forecaster
# Predicts and flags MPs whose fund utilization pace significantly deviates from expected timelines.
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
# Composite Risk Model  (INFERENCE MODE — uses pre-trained XGBoost + SHAP)
# Aggregates features from all 4 engines into a single master risk score for the MP.
# Uses SHAP (SHapley Additive exPlanations) to provide explainable risk factors.
# ---------------------------------------------------------------------------
def run_composite_model(
    mp_features_csv: str,
    intermediates_dir: str,
    model_pkl: str = os.path.join(MODELS_DIR, "composite_xgb_shap_model.pkl"),
) -> dict:
    log(f"Composite Risk Model  [inference]  ({mp_features_csv})")
    import shap

    # Load pre-trained model bundle
    with open(model_pkl, "rb") as f:
        bundle = pickle.load(f)
    model = bundle["model"]
    calibrator = bundle["calibrator"]
    feature_cols = bundle["feature_cols"]
    decision_threshold = bundle["decision_threshold"]
    capacity_threshold = bundle.get("capacity_threshold", decision_threshold)
    band_cuts = bundle.get("config", {}).get("band_cuts", [0.25, 0.50, 0.75])
    n_drv = bundle.get("config", {}).get("top_shap_drivers", 3)

    # Load the aggregated MP feature matrix
    feat = pd.read_csv(mp_features_csv)
    log(f"  Loaded features: {feat.shape}")

    # Build the feature matrix — fill missing columns with 0
    for c in feature_cols:
        if c not in feat.columns:
            feat[c] = 0.0
    X = feat[feature_cols].copy()
    for c in X.columns:
        if X[c].dtype == bool:
            X[c] = X[c].astype(int)
        elif not pd.api.types.is_numeric_dtype(X[c]):
            X[c] = (X[c].astype(str).str.strip().str.lower()
                    .map({"true": 1, "false": 0})).astype(float)
    X = X.replace([np.inf, -np.inf], np.nan).astype(float)

    # Predict probabilities using the pre-trained model
    raw_proba = model.predict_proba(X)[:, 1]
    # Calibrate
    cal_proba = calibrator.transform(raw_proba)

    # SHAP explanations
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    shap_values = np.asarray(shap_values)
    shap_df = pd.DataFrame(shap_values, columns=feature_cols, index=feat.index)

    # Risk banding
    def band(score, cuts):
        lo, mid, hi = cuts
        if score >= hi:  return "Critical"
        if score >= mid: return "High"
        if score >= lo:  return "Medium"
        return "Low"

    # Build output JSON records
    json_records = []
    id_col = "MP Name"
    for i, row in feat.iterrows():
        score = float(cal_proba[i])
        # Top SHAP drivers
        shap_row = shap_df.iloc[i]
        top_features = shap_row.abs().sort_values(ascending=False).index[:n_drv]
        drivers = [
            {
                "feature": str(f),
                "shap_value": round(float(shap_row[f]), 6),
                "direction": "increases_risk" if shap_row[f] >= 0 else "decreases_risk",
            }
            for f in top_features
        ]

        json_records.append({
            "mp_name": row[id_col],
            "composite_risk_score": round(score, 6),
            "risk_band": band(score, band_cuts),
            "risk_percentile": round(float((cal_proba <= score).mean()), 4),
            "is_flagged_composite": bool(score >= decision_threshold),
            "is_flagged_capacity": bool(score >= capacity_threshold),
            "top_shap_drivers": drivers,
        })

    # Sort by score descending and add rank
    json_records.sort(key=lambda r: r["composite_risk_score"], reverse=True)
    for rank, rec in enumerate(json_records, 1):
        rec["composite_risk_rank"] = rank

    output_json = {
        "run_metadata": {
            "n_mps": len(json_records),
            "n_features": len(feature_cols),
            "decision_threshold": decision_threshold,
            "capacity_threshold": capacity_threshold,
            "mode": "inference",
        },
        "decision_threshold": decision_threshold,
        "capacity_threshold": capacity_threshold,
        "risk_band_cuts": band_cuts,
        "mps": json_records,
    }

    # Save
    json_path = os.path.join(intermediates_dir, "composite_risk_output.json")
    with open(json_path, "w") as f:
        json.dump(output_json, f, indent=2, default=str)
    log(f"  Wrote -> {json_path}")

    # Print summary
    print(f"\nTop MP-level composite risk:")
    for r in json_records[:10]:
        print(f"  {r['composite_risk_rank']:>3}. {r['mp_name']:<20}  "
              f"score={r['composite_risk_score']:.4f}  band={r['risk_band']}")

    return output_json


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

# Entry Function
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
    intermediates_dir = output_dir
    # os.makedirs(intermediates_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # Step 0: Generate all derived features from the raw user input
    # ------------------------------------------------------------------
    log("Step 0: Generating features from user input JSON")
    data = process_input_json(input_json, registry_path=os.path.join(DATA_DIR, "vendor_registry.csv"))
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
    engine3_out = os.path.join(intermediates_dir, "engine3_output.csv")
    engine3_pkl = os.path.join(intermediates_dir, "engine3_models.pkl")
    features_out = os.path.join(intermediates_dir, "mp_composite_features.csv")

    # Engine 1: Cost Anomaly
    run_cost_anomaly(works_df, engine1_out)

    # Engine 4: Duplicate/Ghost Work
    run_duplicate_ghost(works_df, engine4_out)

    # Engine 2: Vendor Collusion
    run_vendor_collusion(expenditure_df, registry_df, engine2_out)

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

