import json
import os
import pickle
import warnings
from datetime import datetime

import numpy as np
import pandas as pd

import optuna
import shap
import xgboost as xgb

from sklearn.isotonic import IsotonicRegression
from sklearn.model_selection import StratifiedKFold, RepeatedStratifiedKFold
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    matthews_corrcoef,
    roc_auc_score,
)

warnings.filterwarnings("ignore", category=FutureWarning)
optuna.logging.set_verbosity(optuna.logging.WARNING)


import os as _os

if _os.path.isdir("/kaggle/working"):
    _BASE_IN, _BASE_OUT = "/kaggle/working", "/kaggle/working/risk_outputs"
elif _os.path.isdir("/mnt/user-data/outputs"):
    _BASE_IN, _BASE_OUT = "/home/claude", "/mnt/user-data/outputs/risk_outputs"
else:
    _BASE_IN, _BASE_OUT = ".", "./risk_outputs"

CONFIG = {
    "features_csv": _os.path.join(_BASE_IN, "mp_composite_features.csv"),
    "output_dir": _BASE_OUT,
    "id_col": "MP Name",

    "label_source_col": "injected_anomaly_frac",
    "label_quantile": 0.75,
    "min_positives": 8,

    "drop_cols": [
        "MP Name", "injected_anomaly_frac",
        "constituency_proxy", "constituency_proxy_state", "constituency_proxy_district",
        "top_vendor", "top_vendor_total_amount", "top_vendor_collusion_score",
        "top_vendor_is_flagged_collusion",
    ],

    "leaky_features": [
        "anomaly_flag_rate",
        "anomaly_score_mean",
        "anomaly_score_max",
    ],
    "drop_leaky_features": False,
    "leakage_audit": True,

    "cv_folds": 5,
    "cv_repeats": 3,
    "random_state": 42,

    "n_trials": 120,
    "optuna_metric": "pr_auc",
    "optuna_timeout_sec": None,

    "threshold_objective": "mcc",
    "cost_fn": 10.0,
    "cost_fp": 1.0,
    "min_recall": 0.80,
    "audit_capacity_frac": 0.15,

    "band_cuts": [0.25, 0.50, 0.75],

    "top_shap_drivers": 3,
    "save_shap_plot": True,
}


def log(msg):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)
    return path


def build_target(feat, cfg):
    """Quantile label with a top-k fallback when the source column is
    tie-heavy (e.g. lots of exact zeros make the quantile cut degenerate)."""
    src = cfg["label_source_col"]
    if src not in feat.columns:
        raise KeyError(f"label source column '{src}' not in features file")

    thr = feat[src].quantile(cfg["label_quantile"])
    y = (feat[src] >= thr).astype(int)

    n_pos = int(y.sum())
    degenerate = n_pos < cfg["min_positives"] or n_pos == len(feat)
    mode = "quantile"

    if degenerate:
        k = max(cfg["min_positives"],
                int(round(len(feat) * (1 - cfg["label_quantile"]))))
        k = min(k, len(feat) - 1)
        top_idx = feat[src].nlargest(k).index
        y = pd.Series(0, index=feat.index, dtype=int)
        y.loc[top_idx] = 1
        thr = float(feat.loc[top_idx, src].min())
        mode = "top_k_fallback"
        log(f"quantile label was degenerate -> fell back to top-{k}")

    return y, float(thr), mode


def select_features(feat, cfg, drop_leaky):
    drop = set(cfg["drop_cols"]) | {"target_high_risk", "true_label"}
    if drop_leaky:
        drop |= set(cfg["leaky_features"])

    cols = []
    for c in feat.columns:
        if c in drop:
            continue
        s = feat[c]
        if s.dtype == bool:
            cols.append(c)
        elif pd.api.types.is_numeric_dtype(s):
            cols.append(c)
        elif s.dropna().astype(str).str.lower().isin({"true", "false"}).all() and s.notna().any():
            cols.append(c)
    return cols


def coerce_matrix(feat, feature_cols):
    X = feat[feature_cols].copy()
    for c in X.columns:
        if X[c].dtype == bool:
            X[c] = X[c].astype(int)
        elif not pd.api.types.is_numeric_dtype(X[c]):
            X[c] = (X[c].astype(str).str.strip().str.lower()
                    .map({"true": 1, "false": 0})).astype(float)
    X = X.replace([np.inf, -np.inf], np.nan)
    return X.astype(float)


def safe_splits(y, folds):
    """K cannot exceed the size of the smaller class."""
    n_pos, n_neg = int(y.sum()), int((y == 0).sum())
    return max(2, min(folds, n_pos, n_neg))


def pos_weight(y):
    n_pos = max(int((y == 1).sum()), 1)
    return float((y == 0).sum()) / n_pos


def fit_fold_model(params, X_tr, y_tr, seed):
    m = xgb.XGBClassifier(
        **params,
        scale_pos_weight=pos_weight(y_tr),
        eval_metric="aucpr",
        tree_method="hist",
        random_state=seed,
        n_jobs=-1,
    )
    m.fit(X_tr, y_tr, verbose=False)
    return m


def make_objective(X, y, cfg):
    n_splits = safe_splits(y, cfg["cv_folds"])
    scorer = (average_precision_score if cfg["optuna_metric"] == "pr_auc"
              else roc_auc_score)

    def objective(trial):
        params = {
            "n_estimators":     trial.suggest_int("n_estimators", 100, 900, step=50),
            "max_depth":        trial.suggest_int("max_depth", 2, 7),
            "learning_rate":    trial.suggest_float("learning_rate", 0.01, 0.30, log=True),
            "subsample":        trial.suggest_float("subsample", 0.5, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.4, 1.0),
            "colsample_bylevel": trial.suggest_float("colsample_bylevel", 0.4, 1.0),
            "min_child_weight": trial.suggest_float("min_child_weight", 0.5, 20.0, log=True),
            "gamma":            trial.suggest_float("gamma", 1e-4, 5.0, log=True),
            "reg_alpha":        trial.suggest_float("reg_alpha", 1e-4, 10.0, log=True),
            "reg_lambda":       trial.suggest_float("reg_lambda", 1e-3, 50.0, log=True),
            "max_delta_step":   trial.suggest_int("max_delta_step", 0, 8),
        }

        skf = StratifiedKFold(n_splits=n_splits, shuffle=True,
                              random_state=cfg["random_state"])
        scores = []
        for i, (tr, va) in enumerate(skf.split(X, y)):
            m = fit_fold_model(params, X.iloc[tr], y.iloc[tr],
                               cfg["random_state"] + i)
            p = m.predict_proba(X.iloc[va])[:, 1]
            scores.append(scorer(y.iloc[va], p))
            trial.report(float(np.mean(scores)), step=i)
            if trial.should_prune():
                raise optuna.TrialPruned()

        trial.set_user_attr("cv_std", float(np.std(scores)))
        return float(np.mean(scores))

    return objective


def tune(X, y, cfg, study_name):
    sampler = optuna.samplers.TPESampler(seed=cfg["random_state"],
                                         multivariate=True, group=True)
    pruner = optuna.pruners.MedianPruner(n_startup_trials=15, n_warmup_steps=1)
    study = optuna.create_study(direction="maximize", sampler=sampler,
                                pruner=pruner, study_name=study_name)

    done = {"n": 0}

    def cb(study_, trial_):
        done["n"] += 1
        if done["n"] % 20 == 0:
            log(f"  optuna {done['n']}/{cfg['n_trials']} trials, "
                f"best {cfg['optuna_metric']}={study_.best_value:.4f}")

    study.optimize(make_objective(X, y, cfg),
                   n_trials=cfg["n_trials"],
                   timeout=cfg["optuna_timeout_sec"],
                   callbacks=[cb],
                   show_progress_bar=False)
    return study


def oof_probabilities(X, y, params, cfg):
    """Repeated stratified CV -> averaged out-of-fold probabilities + per-fold
    metrics. These are the scores we trust for thresholding and reporting."""
    n_splits = safe_splits(y, cfg["cv_folds"])
    rskf = RepeatedStratifiedKFold(n_splits=n_splits,
                                   n_repeats=cfg["cv_repeats"],
                                   random_state=cfg["random_state"])

    acc = np.zeros(len(X))
    cnt = np.zeros(len(X))
    rows = []

    for k, (tr, va) in enumerate(rskf.split(X, y)):
        m = fit_fold_model(params, X.iloc[tr], y.iloc[tr], cfg["random_state"] + k)
        p = m.predict_proba(X.iloc[va])[:, 1]
        acc[va] += p
        cnt[va] += 1
        rows.append({
            "repeat": k // n_splits + 1,
            "fold": k % n_splits + 1,
            "n_train": len(tr),
            "n_valid": len(va),
            "n_pos_valid": int(y.iloc[va].sum()),
            "roc_auc": roc_auc_score(y.iloc[va], p) if y.iloc[va].nunique() > 1 else np.nan,
            "pr_auc": average_precision_score(y.iloc[va], p) if y.iloc[va].nunique() > 1 else np.nan,
            "brier": brier_score_loss(y.iloc[va], p),
        })

    oof = acc / np.maximum(cnt, 1)
    return oof, pd.DataFrame(rows), n_splits


def threshold_sweep(y, p, cfg, grid=None):
    if grid is None:
        grid = np.unique(np.concatenate([
            np.round(np.arange(0.01, 1.00, 0.005), 4),
            np.round(np.unique(p), 6),
        ]))
        grid = grid[(grid > 0) & (grid < 1)]

    y = np.asarray(y)
    rows = []
    for t in grid:
        yhat = (p >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y, yhat, labels=[0, 1]).ravel()
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        spec = tn / (tn + fp) if (tn + fp) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        f2 = 5 * prec * rec / (4 * prec + rec) if (4 * prec + rec) else 0.0
        mcc = matthews_corrcoef(y, yhat) if len(np.unique(yhat)) > 1 else 0.0
        rows.append({
            "threshold": float(t),
            "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn),
            "precision": prec, "recall": rec, "specificity": spec,
            "f1": f1, "f2": f2, "mcc": float(mcc),
            "youden_j": rec + spec - 1.0,
            "alert_rate": float(yhat.mean()),
            "n_alerts": int(yhat.sum()),
            "expected_cost": cfg["cost_fn"] * fn + cfg["cost_fp"] * fp,
        })
    return pd.DataFrame(rows)


def pick_threshold(sweep, cfg):
    obj = cfg["threshold_objective"]
    s = sweep.copy()

    if obj == "min_cost":
        s = s.sort_values(["expected_cost", "alert_rate", "threshold"],
                          ascending=[True, True, False])
        chosen, rule = s.iloc[0], "minimum expected audit cost"
    elif obj == "precision_at_recall":
        elig = s[s["recall"] >= cfg["min_recall"]]
        if elig.empty:
            elig = s.sort_values("recall", ascending=False).head(1)
            rule = f"no threshold reached recall>={cfg['min_recall']}; took max recall"
        else:
            rule = f"max precision subject to recall >= {cfg['min_recall']}"
        elig = elig.sort_values(["precision", "threshold"], ascending=[False, False])
        chosen = elig.iloc[0]
    else:
        col = {"f1": "f1", "f2": "f2", "mcc": "mcc", "youden": "youden_j"}[obj]
        s = s.sort_values([col, "alert_rate", "threshold"],
                          ascending=[False, True, False])
        chosen, rule = s.iloc[0], f"maximum {col} on out-of-fold predictions"

    return float(chosen["threshold"]), rule, chosen


def capacity_threshold(p, frac):
    """Threshold that alerts exactly the top `frac` of MPs by score."""
    frac = min(max(frac, 1e-6), 1.0)
    return float(np.quantile(p, 1 - frac))


def band(score, cuts):
    lo, mid, hi = cuts
    if score >= hi:
        return "Critical"
    if score >= mid:
        return "High"
    if score >= lo:
        return "Medium"
    return "Low"


def run_variant(feat, y, cfg, drop_leaky, tag):
    feature_cols = select_features(feat, cfg, drop_leaky)
    X = coerce_matrix(feat, feature_cols)
    log(f"[{tag}] {X.shape[0]} MPs x {X.shape[1]} features, "
        f"positives={int(y.sum())} ({y.mean():.1%})")

    study = tune(X, y, cfg, study_name=f"composite_risk_{tag}")
    best = dict(study.best_params)
    log(f"[{tag}] best CV {cfg['optuna_metric']} = {study.best_value:.4f}")

    oof, fold_metrics, n_splits = oof_probabilities(X, y, best, cfg)

    raw_metrics = {
        "roc_auc": roc_auc_score(y, oof),
        "pr_auc": average_precision_score(y, oof),
        "brier": brier_score_loss(y, oof),
    }

    iso = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
    oof_cal = iso.fit_transform(oof, y.values)
    cal_metrics = {
        "roc_auc": roc_auc_score(y, oof_cal),
        "pr_auc": average_precision_score(y, oof_cal),
        "brier": brier_score_loss(y, oof_cal),
    }
    log(f"[{tag}] OOF  ROC-AUC={raw_metrics['roc_auc']:.4f}  "
        f"PR-AUC={raw_metrics['pr_auc']:.4f}  "
        f"Brier {raw_metrics['brier']:.4f} -> {cal_metrics['brier']:.4f} after calibration")

    return {
        "tag": tag,
        "feature_cols": feature_cols,
        "X": X,
        "study": study,
        "best_params": best,
        "oof": oof,
        "oof_cal": oof_cal,
        "iso": iso,
        "fold_metrics": fold_metrics,
        "raw_metrics": raw_metrics,
        "cal_metrics": cal_metrics,
        "n_splits": n_splits,
    }


def main(cfg=CONFIG):
    out = ensure_dir(cfg["output_dir"])
    feat = pd.read_csv(cfg["features_csv"])
    log(f"loaded {cfg['features_csv']}: {feat.shape}")

    y, label_thr, label_mode = build_target(feat, cfg)
    feat["target_high_risk"] = y.values
    feat["true_label"] = y.values
    log(f"label: {label_mode}, cut at {cfg['label_source_col']} >= {label_thr:.4f}, "
        f"positive rate {y.mean():.3f}")

    primary = run_variant(feat, y, cfg, cfg["drop_leaky_features"],
                          "no_leak" if cfg["drop_leaky_features"] else "full")

    audit_rows = [{
        "variant": primary["tag"],
        "n_features": len(primary["feature_cols"]),
        "leaky_features_included": not cfg["drop_leaky_features"],
        **{f"oof_{k}": v for k, v in primary["raw_metrics"].items()},
        "best_cv_score": primary["study"].best_value,
    }]
    if cfg["leakage_audit"]:
        alt = run_variant(feat, y, cfg, not cfg["drop_leaky_features"],
                          "full" if cfg["drop_leaky_features"] else "no_leak")
        audit_rows.append({
            "variant": alt["tag"],
            "n_features": len(alt["feature_cols"]),
            "leaky_features_included": cfg["drop_leaky_features"],
            **{f"oof_{k}": v for k, v in alt["raw_metrics"].items()},
            "best_cv_score": alt["study"].best_value,
        })
    pd.DataFrame(audit_rows).to_csv(f"{out}/leakage_audit.csv", index=False)

    X = primary["X"]
    feature_cols = primary["feature_cols"]
    best = primary["best_params"]
    oof_cal = primary["oof_cal"]

    sweep = threshold_sweep(y, oof_cal, cfg)
    sweep.to_csv(f"{out}/threshold_sweep.csv", index=False)

    thr, rule, chosen = pick_threshold(sweep, cfg)
    cap_thr = capacity_threshold(oof_cal, cfg["audit_capacity_frac"])
    log(f"learned threshold = {thr:.4f} ({rule}); "
        f"precision={chosen['precision']:.3f} recall={chosen['recall']:.3f} "
        f"alerts={int(chosen['n_alerts'])}")
    log(f"capacity threshold (top {cfg['audit_capacity_frac']:.0%}) = {cap_thr:.4f}")

    candidates = []
    for name in ["f1", "f2", "mcc", "youden", "min_cost", "precision_at_recall"]:
        c = dict(cfg, threshold_objective=name)
        t, r, row = pick_threshold(sweep, c)
        candidates.append({
            "objective": name, "rule": r, "threshold": t,
            "precision": row["precision"], "recall": row["recall"],
            "f1": row["f1"], "f2": row["f2"], "mcc": row["mcc"],
            "n_alerts": int(row["n_alerts"]), "alert_rate": row["alert_rate"],
            "expected_cost": row["expected_cost"],
            "selected": name == cfg["threshold_objective"],
        })
    cap_row = sweep.iloc[(sweep["threshold"] - cap_thr).abs().argmin()]
    candidates.append({
        "objective": f"capacity_top_{int(cfg['audit_capacity_frac']*100)}pct",
        "rule": "fixed audit capacity", "threshold": cap_thr,
        "precision": cap_row["precision"], "recall": cap_row["recall"],
        "f1": cap_row["f1"], "f2": cap_row["f2"], "mcc": cap_row["mcc"],
        "n_alerts": int(cap_row["n_alerts"]), "alert_rate": cap_row["alert_rate"],
        "expected_cost": cap_row["expected_cost"], "selected": False,
    })
    pd.DataFrame(candidates).to_csv(f"{out}/threshold_candidates.csv", index=False)

    final_model = fit_fold_model(best, X, y, cfg["random_state"])
    in_sample = final_model.predict_proba(X)[:, 1]

    explainer = shap.TreeExplainer(final_model)
    shap_values = explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    shap_values = np.asarray(shap_values)
    base_value = float(np.ravel(explainer.expected_value)[0])

    shap_df = pd.DataFrame(shap_values, columns=feature_cols, index=feat.index)

    n_drv = cfg["top_shap_drivers"]

    def drivers(row):
        order = row.abs().sort_values(ascending=False).index[:n_drv]
        return "; ".join(f"{c} ({row[c]:+.3f})" for c in order)

    feat["top_shap_drivers"] = shap_df.apply(drivers, axis=1)
    for i in range(n_drv):
        feat[f"driver_{i+1}_feature"] = shap_df.apply(
            lambda r: r.abs().sort_values(ascending=False).index[i], axis=1)
        feat[f"driver_{i+1}_shap"] = shap_df.apply(
            lambda r: r[r.abs().sort_values(ascending=False).index[i]], axis=1)

    feat["composite_risk_score"] = oof_cal
    feat["composite_risk_score_raw_oof"] = primary["oof"]
    feat["composite_risk_score_in_sample"] = in_sample
    feat["decision_threshold"] = thr
    feat["is_flagged_composite"] = (feat["composite_risk_score"] >= thr).astype(int)
    feat["is_flagged_capacity"] = (feat["composite_risk_score"] >= cap_thr).astype(int)
    feat["risk_percentile"] = feat["composite_risk_score"].rank(pct=True)
    feat["risk_band"] = feat["composite_risk_score"].apply(lambda s: band(s, cfg["band_cuts"]))
    feat["label_agreement"] = np.where(
        feat["is_flagged_composite"] == feat["target_high_risk"], "agree",
        np.where(feat["is_flagged_composite"] == 1, "false_positive", "false_negative"))

    feat = feat.sort_values(["composite_risk_score", "composite_risk_score_raw_oof"],
                        ascending=False).reset_index(drop=True)
    feat["composite_risk_rank"] = np.arange(1, len(feat) + 1)

    front = [c for c in [
        cfg["id_col"], "composite_risk_rank", "composite_risk_score", "risk_band",
        "is_flagged_composite", "constituency_proxy", "top_vendor",
        "is_ghost_work_flagged", "true_label", "top_shap_drivers",
    ] if c in feat.columns]
    feat = feat[front + [c for c in feat.columns if c not in front]]

    feat.to_csv(f"{out}/composite_risk_output.csv", index=False)

    shap_out = shap_df.copy()
    shap_out.insert(0, cfg["id_col"], pd.read_csv(cfg["features_csv"])[cfg["id_col"]])
    shap_out["shap_base_value"] = base_value
    shap_out.to_csv(f"{out}/shap_values_per_mp.csv", index=False)

    imp = pd.DataFrame({
        "feature": feature_cols,
        "mean_abs_shap": np.abs(shap_values).mean(axis=0),
        "mean_shap": shap_values.mean(axis=0),
        "gain_importance": [float(final_model.get_booster()
                                  .get_score(importance_type="gain").get(f, 0.0))
                            for f in feature_cols],
    }).sort_values("mean_abs_shap", ascending=False)
    imp["shap_rank"] = np.arange(1, len(imp) + 1)
    imp.to_csv(f"{out}/shap_feature_importance.csv", index=False)

    long = (shap_out.melt(id_vars=[cfg["id_col"]], value_vars=feature_cols,
                          var_name="feature", value_name="shap_value"))
    long["abs_shap"] = long["shap_value"].abs()
    long["direction"] = np.where(long["shap_value"] >= 0, "increases_risk", "decreases_risk")
    long["driver_rank"] = long.groupby(cfg["id_col"])["abs_shap"] \
                              .rank(ascending=False, method="first").astype(int)
    long[long["driver_rank"] <= n_drv].sort_values([cfg["id_col"], "driver_rank"]) \
        .to_csv(f"{out}/top_drivers_long.csv", index=False)

    trials = primary["study"].trials_dataframe()
    trials.to_csv(f"{out}/optuna_trials.csv", index=False)
    pd.DataFrame([{"param": k, "value": v} for k, v in best.items()] +
                 [{"param": "scale_pos_weight", "value": pos_weight(y)},
                  {"param": f"best_cv_{cfg['optuna_metric']}",
                   "value": primary["study"].best_value},
                  {"param": "n_trials_completed", "value": len(trials)}]) \
        .to_csv(f"{out}/best_params.csv", index=False)

    try:
        imp_opt = optuna.importance.get_param_importances(primary["study"])
        pd.DataFrame([{"param": k, "importance": v} for k, v in imp_opt.items()]) \
            .to_csv(f"{out}/optuna_param_importance.csv", index=False)
    except Exception as e:
        log(f"optuna param importance skipped: {e}")

    primary["fold_metrics"].to_csv(f"{out}/cv_fold_metrics.csv", index=False)

    tn, fp, fn, tp = confusion_matrix(
        y, feat.sort_values("composite_risk_rank")["is_flagged_composite"]
        if False else (oof_cal >= thr).astype(int), labels=[0, 1]).ravel()
    metrics_summary_row = {
        "run_timestamp": datetime.now().isoformat(timespec="seconds"),
        "n_mps": len(X), "n_features": len(feature_cols),
        "positive_rate": float(y.mean()),
        "label_mode": label_mode, "label_threshold_value": label_thr,
        "label_quantile": cfg["label_quantile"],
        "leaky_features_dropped": cfg["drop_leaky_features"],
        "cv_folds": primary["n_splits"], "cv_repeats": cfg["cv_repeats"],
        "oof_roc_auc": primary["raw_metrics"]["roc_auc"],
        "oof_pr_auc": primary["raw_metrics"]["pr_auc"],
        "oof_brier": primary["raw_metrics"]["brier"],
        "calibrated_brier": primary["cal_metrics"]["brier"],
        "decision_threshold": thr, "threshold_rule": rule,
        "threshold_objective": cfg["threshold_objective"],
        "capacity_threshold": cap_thr,
        "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn),
        "precision": float(chosen["precision"]), "recall": float(chosen["recall"]),
        "f1": float(chosen["f1"]), "f2": float(chosen["f2"]), "mcc": float(chosen["mcc"]),
        "n_flagged": int((oof_cal >= thr).sum()),
    }
    pd.DataFrame([metrics_summary_row]).to_csv(f"{out}/model_metrics_summary.csv", index=False)

    dec = pd.DataFrame({"score": oof_cal, "y": y.values})
    dec["decile"] = pd.qcut(dec["score"].rank(method="first"), 10,
                            labels=list(range(10, 0, -1))).astype(int)
    gains = dec.groupby("decile").agg(
        n=("y", "size"), n_positive=("y", "sum"),
        mean_score=("score", "mean"), actual_rate=("y", "mean")).reset_index()
    gains = gains.sort_values("decile")
    gains["cum_positives"] = gains["n_positive"].cumsum()
    gains["cum_capture_rate"] = gains["cum_positives"] / max(int(y.sum()), 1)
    gains["lift"] = gains["actual_rate"] / max(float(y.mean()), 1e-9)
    gains.to_csv(f"{out}/gains_by_decile.csv", index=False)

    pd.DataFrame({"feature": feature_cols}).to_csv(f"{out}/feature_list.csv", index=False)

    with open(f"{out}/composite_xgb_shap_model.pkl", "wb") as f:
        pickle.dump({
            "model": final_model,
            "calibrator": primary["iso"],
            "explainer": explainer,
            "feature_cols": feature_cols,
            "best_params": best,
            "decision_threshold": thr,
            "threshold_rule": rule,
            "capacity_threshold": cap_thr,
            "label_threshold_value": label_thr,
            "label_quantile": cfg["label_quantile"],
            "config": cfg,
        }, f)

    if cfg["save_shap_plot"]:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        shap.summary_plot(shap_values, X, show=False)
        plt.tight_layout()
        plt.savefig(f"{out}/shap_summary.png", dpi=150)
        plt.close()

    with open(f"{out}/run_config.json", "w") as f:
        json.dump(cfg, f, indent=2, default=str)

    log(f"wrote CSVs to ./{out}/")
    cols = [cfg["id_col"], "composite_risk_rank", "composite_risk_score",
            "risk_band", "is_flagged_composite", "top_shap_drivers"]
    print("\nTop 10 MP-level composite risk:")
    print(feat[cols].head(10).to_string(index=False))

    json_records = []
    for _, row in feat.iterrows():
        json_records.append({
            "mp_name": row[cfg["id_col"]],
            "composite_risk_rank": int(row["composite_risk_rank"]),
            "composite_risk_score": round(float(row["composite_risk_score"]), 6),
            "composite_risk_score_raw_oof": round(float(row["composite_risk_score_raw_oof"]), 6),
            "composite_risk_score_in_sample": round(float(row["composite_risk_score_in_sample"]), 6),
            "risk_band": row["risk_band"],
            "risk_percentile": round(float(row["risk_percentile"]), 4),
            "is_flagged_composite": bool(row["is_flagged_composite"]),
            "is_flagged_capacity": bool(row["is_flagged_capacity"]),
            "label_agreement": row["label_agreement"],
            "top_shap_drivers": [
                {
                    "feature": row[f"driver_{i+1}_feature"],
                    "shap_value": round(float(row[f"driver_{i+1}_shap"]), 6),
                    "direction": "increases_risk" if row[f"driver_{i+1}_shap"] >= 0 else "decreases_risk",
                }
                for i in range(n_drv)
            ],
        })

    output_json = {
        "run_metadata": {
            k: (v if not isinstance(v, (np.integer, np.floating)) else float(v))
            for k, v in metrics_summary_row.items()
        },
        "decision_threshold": thr,
        "capacity_threshold": cap_thr,
        "risk_band_cuts": cfg["band_cuts"],
        "mps": json_records,
    }
    with open(f"{out}/composite_risk_output.json", "w") as f:
        json.dump(output_json, f, indent=2, default=str)
    log(f"wrote final JSON -> {out}/composite_risk_output.json")


if __name__ == "__main__":
    import traceback
    try:
        main()
    except Exception:
        print("\n=== main() FAILED — full traceback below ===")
        traceback.print_exc()
    finally:
        print(f"\n=== files currently in {CONFIG['output_dir']} ===")
        try:
            for f in sorted(_os.listdir(CONFIG["output_dir"])):
                print(" ", f)
        except FileNotFoundError:
            print("  (output_dir does not exist -- main() likely failed before writing anything)")
