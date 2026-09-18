import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "engines"))


def log(msg):
    print(f"\n=== {msg} ===", flush=True)


def run_cost_anomaly(input_csv, output_csv):
    log(f"Engine 1 / Cost Anomaly Detector  ({input_csv} -> {output_csv})")
    from cost_anomaly_detector import run_cost_anomaly_engine
    run_cost_anomaly_engine(input_csv, output_csv)


def run_duplicate_ghost(input_csv1, input_csv2, merge_key, output_csv):
    log(f"Engine 4 / Duplicate-Ghost Work Detector  ({input_csv1} + {input_csv2} -> {output_csv})")
    import pandas as pd
    from duplicate_ghost_work_detector import DuplicateGhostWorkDetector, combine_outputs

    df1 = pd.read_csv(input_csv1)
    df2 = pd.read_csv(input_csv2)
    if input_csv1 != input_csv2:
        shared_cols = set(df1.columns) & set(df2.columns) - {merge_key}
        df = df1.merge(df2.drop(columns=list(shared_cols), errors="ignore"), on=merge_key, how="inner")
    else:
        df = df1
    df["sanction_date"] = pd.to_datetime(df["sanction_date"])

    detector = DuplicateGhostWorkDetector()
    work_features, pair_evidence = detector.fit_predict(df)
    combined = combine_outputs(work_features, pair_evidence)
    combined.to_csv(output_csv, index=False)
    print(f"Saved -> {output_csv}  (rows={len(combined)}, flagged={int(combined['is_duplicate_flagged'].sum())})")


def run_vendor_collusion(exp_csv, registry_csv, output_csv, output_pkl):
    log(f"Engine 2 / Vendor Collusion Network  ({exp_csv} + {registry_csv} -> {output_csv})")
    import pandas as pd
    import pickle
    from vendor_collusion_network_detector import VendorCollusionNetworkDetector

    exp = pd.read_csv(exp_csv)
    reg = pd.read_csv(registry_csv)
    detector = VendorCollusionNetworkDetector()
    vendor_features = detector.fit_predict(exp, reg)
    vendor_features.to_csv(output_csv, index=False)
    with open(output_pkl, "wb") as f:
        pickle.dump(detector, f)
    print(f"Saved -> {output_csv}  (rows={len(vendor_features)}, "
          f"flagged={int(vendor_features['is_flagged_collusion'].sum())})")


def run_fund_utilization(input_csv, output_csv, models_pkl, group_col="MP Name"):
    log(f"Engine 3 / Fund Utilization Forecaster  ({input_csv} -> {output_csv})")
    import pandas as pd
    from fund_utilization_forecaster import FundUtilizationForecaster, FundUtilizationConfig

    df = pd.read_csv(input_csv)
    cfg = FundUtilizationConfig(group_col=group_col)
    forecaster = FundUtilizationForecaster(config=cfg)
    result = forecaster.fit_predict(df)
    result.to_csv(output_csv, index=False)
    forecaster.save_models(models_pkl)
    print(f"Saved -> {output_csv}  (rows={len(result)}, "
          f"flagged={int(result['is_deviation_flagged'].sum())})")


def run_build_features(engine1_csv, engine4_csv, engine3_csv, engine2_csv, output_csv):
    log(f"Build Features  (4 engine outputs -> {output_csv})")
    from build_features import build_features
    build_features(engine1_csv, engine4_csv, engine3_csv, engine2_csv, output_csv)


def run_composite_model(mp_features_csv, output_dir):
    log(f"Composite Risk Model (XGBoost + Optuna + SHAP)  ({mp_features_csv} -> {output_dir}/composite_risk_output.json)")
    import composite_risk_model as crm
    crm.CONFIG["features_csv"] = mp_features_csv
    crm.CONFIG["output_dir"] = output_dir
    crm.main(crm.CONFIG)


def main():
    p = argparse.ArgumentParser(description="MPLADS 5-engine fraud detection pipeline")
    p.add_argument("--cost_anomaly_input")
    p.add_argument("--dup_ghost_input1")
    p.add_argument("--dup_ghost_input2")
    p.add_argument("--dup_ghost_merge_key", default="work_id")
    p.add_argument("--vendor_exp_input")
    p.add_argument("--vendor_registry_input")
    p.add_argument("--fund_util_input")
    p.add_argument("--fund_util_group_col", default="MP Name")

    p.add_argument("--skip_cost_anomaly", action="store_true")
    p.add_argument("--skip_dup_ghost", action="store_true")
    p.add_argument("--skip_vendor_collusion", action="store_true")
    p.add_argument("--skip_fund_util", action="store_true")

    p.add_argument("--output_dir", default="./pipeline_run")
    args = p.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    engine1_out = os.path.join(args.output_dir, "engine1_output.csv")
    engine4_out = os.path.join(args.output_dir, "engine4_output.csv")
    engine2_out = os.path.join(args.output_dir, "engine2_output.csv")
    engine2_pkl = os.path.join(args.output_dir, "engine2_detector.pkl")
    engine3_out = os.path.join(args.output_dir, "engine3_output.csv")
    engine3_pkl = os.path.join(args.output_dir, "engine3_models.pkl")
    features_out = os.path.join(args.output_dir, "mp_composite_features.csv")

    if not args.skip_cost_anomaly:
        run_cost_anomaly(args.cost_anomaly_input, engine1_out)

    if not args.skip_dup_ghost:
        run_duplicate_ghost(args.dup_ghost_input1, args.dup_ghost_input2,
                             args.dup_ghost_merge_key, engine4_out)

    if not args.skip_vendor_collusion:
        run_vendor_collusion(args.vendor_exp_input, args.vendor_registry_input,
                              engine2_out, engine2_pkl)

    if not args.skip_fund_util:
        run_fund_utilization(args.fund_util_input, engine3_out, engine3_pkl,
                              args.fund_util_group_col)

    run_build_features(engine1_out, engine4_out, engine3_out, engine2_out, features_out)
    run_composite_model(features_out, args.output_dir)

    log(f"Pipeline complete. Final output: {args.output_dir}/composite_risk_output.json")


if __name__ == "__main__":
    main()
