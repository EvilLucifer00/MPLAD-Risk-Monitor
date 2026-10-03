import sys
import numpy as np
import pandas as pd


def build_features(engine1_csv, engine4_csv, engine3_csv, engine2_csv, output_csv):
    e1 = pd.read_csv(engine1_csv)
    e4 = pd.read_csv(engine4_csv)
    e3 = pd.read_csv(engine3_csv)
    e2 = pd.read_csv(engine2_csv)

    e4 = e4.copy()
    e4["Work ID"] = e4["work_id"].str.replace(r"^[A-Za-z]+_", "", regex=True).astype(e1["Work ID"].dtype)
    e14 = e1.merge(
        e4[["Work ID", "duplicate_score", "is_duplicate_flagged", "duplicate_group_size"]],
        on="Work ID", how="left",
    )

    g1 = e14.groupby("MP Name").agg(
        num_works=("Work ID", "count"),
        anomaly_score_mean=("Anomaly_Score", "mean"),
        anomaly_score_max=("Anomaly_Score", "max"),
        anomaly_flag_rate=("Predicted_Anomaly", "mean"),
        cost_deviation_pct_mean=("cost_deviation_pct", "mean"),
        cost_deviation_pct_max=("cost_deviation_pct", "max"),
        sor_match_confidence_mean=("sor_match_confidence", "mean"),
        duplicate_score_mean=("duplicate_score", "mean"),
        duplicate_score_max=("duplicate_score", "max"),
        duplicate_flag_rate=("is_duplicate_flagged", "mean"),
        duplicate_group_size_max=("duplicate_group_size", "max"),
        injected_anomaly_frac=("is_anomaly_injected", "mean"),
    ).reset_index()

    e3 = e3.copy()
    e3["residual_pct"] = (e3["actual_amount"] - e3["prophet_forecast"]).abs() / e3["prophet_forecast"].replace(0, np.nan)
    g3 = e3.groupby("MP Name").agg(
        num_months=("month", "count"),
        deviation_flag_rate=("is_deviation_flagged", "mean"),
        residual_pct_mean=("residual_pct", "mean"),
        residual_pct_max=("residual_pct", "max"),
        total_actual_amount=("actual_amount", "sum"),
    ).reset_index()
    g3["residual_pct_mean"] = g3["residual_pct_mean"].fillna(0)
    g3["residual_pct_max"] = g3["residual_pct_max"].fillna(0)

    g2 = e2.groupby("primary_mp").agg(
        num_primary_vendors=("Vendor", "count"),
        collusion_score_mean=("collusion_risk_score", "mean"),
        collusion_score_max=("collusion_risk_score", "max"),
        flagged_vendor_rate=("is_flagged_collusion", "mean"),
        any_flagged_vendor=("is_flagged_collusion", "max"),
    ).reset_index().rename(columns={"primary_mp": "MP Name"})

    feat = g1.merge(g3, on="MP Name", how="left").merge(g2, on="MP Name", how="left")

    for col, default in [
        ("num_primary_vendors", 0), ("collusion_score_mean", 0.0), ("collusion_score_max", 0.0),
        ("flagged_vendor_rate", 0.0), ("any_flagged_vendor", False),
        ("num_months", 0), ("deviation_flag_rate", 0.0), ("residual_pct_mean", 0.0),
        ("residual_pct_max", 0.0), ("total_actual_amount", 0.0),
        ("duplicate_score_mean", 0.0), ("duplicate_score_max", 0.0),
        ("duplicate_flag_rate", 0.0), ("duplicate_group_size_max", 1.0),
    ]:
        feat[col] = feat[col].fillna(default)

    feat.to_csv(output_csv, index=False)
    print(f"Saved MP-level composite features -> {output_csv}")
    print(f"Shape: {feat.shape}")
    return feat


if __name__ == "__main__":
    engine1_csv = sys.argv[1] if len(sys.argv) > 1 else "engine1_augmented_results.csv"
    engine4_csv = sys.argv[2] if len(sys.argv) > 2 else "duplicate_ghost_work_output.csv"
    engine3_csv = sys.argv[3] if len(sys.argv) > 3 else "fund_utilization_output.csv"
    engine2_csv = sys.argv[4] if len(sys.argv) > 4 else "vendor_collusion_output.csv"
    output_csv = sys.argv[5] if len(sys.argv) > 5 else "mp_composite_features.csv"

    build_features(engine1_csv, engine4_csv, engine3_csv, engine2_csv, output_csv)
