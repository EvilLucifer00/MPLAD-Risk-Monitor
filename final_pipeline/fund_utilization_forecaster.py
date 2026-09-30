from __future__ import annotations

import logging
import pickle
import warnings
from dataclasses import dataclass, asdict
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger("fund_utilization_forecaster")
logging.basicConfig(level=logging.INFO)

warnings.filterwarnings("ignore", module="statsmodels")
warnings.filterwarnings("ignore", module="cmdstanpy")


@dataclass
class FundUtilizationConfig:
    group_col: str = "MP Name"
    date_col: str = "Expenditure Date"
    amount_col: str = "Expenditure Amount (₹)"
    freq: str = "MS"

    min_periods_to_fit: int = 6
    min_periods_for_seasonal: int = 36

    interval_width: float = 0.95
    forecast_horizon: int = 3

    prophet_yearly_seasonality: str = "auto"

    prophet_changepoint_prior_scale: float = 0.01


class FundUtilizationForecaster:
    """
    Usage
    -----
        fc = FundUtilizationForecaster()
        result = fc.fit_predict(expenditures_df)

    `expenditures_df` must contain the configured group_col, date_col, and
    amount_col (defaults: "MP Name", "Expenditure Date", "Expenditure
    Amount (₹)" — matching the MPLADS expenditures export directly).
    """

    def __init__(self, config: Optional[FundUtilizationConfig] = None):
        self.cfg = config or FundUtilizationConfig()
        self.models_: dict = {}

    def _validate(self, df: pd.DataFrame) -> None:
        required = {self.cfg.group_col, self.cfg.date_col, self.cfg.amount_col}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Input dataframe missing required columns: {missing}")

    def _build_group_series(self, df: pd.DataFrame) -> dict[str, pd.Series]:
        """One regular monthly series per group, reindexed over that group's
        OWN first-to-last observed month (not the global range) and gaps
        filled with 0 -- a month with genuinely zero spending is real
        information, not a missing value to impute."""
        df = df.copy()
        df[self.cfg.date_col] = pd.to_datetime(df[self.cfg.date_col], utc=True).dt.tz_localize(None)

        series_by_group = {}
        for group, sub in df.groupby(self.cfg.group_col):
            monthly = sub.set_index(self.cfg.date_col)[self.cfg.amount_col].resample(self.cfg.freq).sum()
            full_index = pd.date_range(monthly.index.min(), monthly.index.max(), freq=self.cfg.freq)
            monthly = monthly.reindex(full_index, fill_value=0.0)
            series_by_group[group] = monthly
        return series_by_group

    def _fit_prophet(self, series: pd.Series):
        """Returns (forecast_df, fitted_model) or (None, None) on failure."""
        from prophet import Prophet

        use_yearly = (
            len(series) >= self.cfg.min_periods_for_seasonal
            if self.cfg.prophet_yearly_seasonality == "auto"
            else self.cfg.prophet_yearly_seasonality
        )

        train_df = pd.DataFrame({"ds": series.index, "y": series.values})
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model = Prophet(
                    interval_width=self.cfg.interval_width,
                    yearly_seasonality=use_yearly,
                    weekly_seasonality=False,
                    daily_seasonality=False,
                    changepoint_prior_scale=self.cfg.prophet_changepoint_prior_scale,
                )
                model.fit(train_df)
                future = model.make_future_dataframe(periods=self.cfg.forecast_horizon, freq=self.cfg.freq)
                forecast = model.predict(future)
        except Exception as e:
            logger.warning("Prophet fit failed for a group: %s", e)
            return None, None

        forecast_df = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].rename(columns={
            "ds": "month", "yhat": "prophet_forecast",
            "yhat_lower": "prophet_lower", "yhat_upper": "prophet_upper",
        })
        return forecast_df, model

    def _fit_arima(self, series: pd.Series):
        """Returns (forecast_df, fitted_results) or (None, None) on failure."""
        from statsmodels.tsa.statespace.sarimax import SARIMAX

        use_seasonal = len(series) >= self.cfg.min_periods_for_seasonal
        order = (1, 1, 1)
        seasonal_order = (1, 1, 1, 12) if use_seasonal else (0, 0, 0, 0)

        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model = SARIMAX(
                    series, order=order, seasonal_order=seasonal_order,
                    enforce_stationarity=False, enforce_invertibility=False,
                )
                res = model.fit(disp=False)

                alpha = 1 - self.cfg.interval_width
                in_sample = res.get_prediction(start=0, end=len(series) - 1)
                in_sample_ci = in_sample.conf_int(alpha=alpha)
                in_sample_mean = in_sample.predicted_mean

                fc = res.get_forecast(steps=self.cfg.forecast_horizon)
                fc_ci = fc.conf_int(alpha=alpha)
                fc_mean = fc.predicted_mean

            months = list(series.index) + list(
                pd.date_range(
                    series.index[-1] + pd.tseries.frequencies.to_offset(self.cfg.freq),
                    periods=self.cfg.forecast_horizon, freq=self.cfg.freq,
                )
            )
            means = pd.concat([in_sample_mean, fc_mean]).to_numpy()
            lowers = pd.concat([in_sample_ci.iloc[:, 0], fc_ci.iloc[:, 0]]).to_numpy()
            uppers = pd.concat([in_sample_ci.iloc[:, 1], fc_ci.iloc[:, 1]]).to_numpy()
        except Exception as e:
            logger.warning("ARIMA fit failed for a group: %s", e)
            return None, None

        forecast_df = pd.DataFrame({
            "month": months, "arima_forecast": means,
            "arima_lower": lowers, "arima_upper": uppers,
        })
        return forecast_df, res

    def fit_predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Returns one combined DataFrame: one row per (group, month), covering
        both observed history and `forecast_horizon` genuine future months,
        with both models' fitted/forecast values, confidence intervals, and
        the final `is_deviation_flagged` verdict (both models must agree).
        """
        self._validate(df)
        series_by_group = self._build_group_series(df)

        rows = []
        n_fit, n_skipped, n_flagged_total = 0, 0, 0
        self.models_ = {}

        for group, series in series_by_group.items():
            if len(series) < self.cfg.min_periods_to_fit:
                n_skipped += 1
                self.models_[group] = {"prophet": None, "arima": None}
                for month, actual in series.items():
                    rows.append({
                        self.cfg.group_col: group, "month": month, "actual_amount": actual,
                        "status": "insufficient_history",
                        "prophet_forecast": np.nan, "prophet_lower": np.nan, "prophet_upper": np.nan,
                        "arima_forecast": np.nan, "arima_lower": np.nan, "arima_upper": np.nan,
                        "is_deviation_flagged": False,
                    })
                continue

            prophet_res, prophet_model = self._fit_prophet(series)
            arima_res, arima_model = self._fit_arima(series)
            self.models_[group] = {"prophet": prophet_model, "arima": arima_model}
            if prophet_res is None or arima_res is None:
                n_skipped += 1
                status = "model_fit_failed"
            else:
                n_fit += 1
                status = "modeled"

            actual_df = pd.DataFrame({"month": series.index, "actual_amount": series.values})
            merged = actual_df.merge(prophet_res, on="month", how="outer") if prophet_res is not None else actual_df
            merged = merged.merge(arima_res, on="month", how="outer") if arima_res is not None else merged
            merged[self.cfg.group_col] = group
            merged["status"] = status

            if status == "modeled":
                prophet_dev = (merged["actual_amount"] < merged["prophet_lower"]) | \
                              (merged["actual_amount"] > merged["prophet_upper"])
                arima_dev = (merged["actual_amount"] < merged["arima_lower"]) | \
                            (merged["actual_amount"] > merged["arima_upper"])
                merged["is_deviation_flagged"] = (prophet_dev & arima_dev).fillna(False)
            else:
                merged["is_deviation_flagged"] = False

            n_flagged_total += int(merged["is_deviation_flagged"].sum())
            rows.append(merged)

        result = pd.concat(
            [r if isinstance(r, pd.DataFrame) else pd.DataFrame([r]) for r in rows],
            ignore_index=True,
        )
        cols = [self.cfg.group_col, "month", "actual_amount", "status",
                "prophet_forecast", "prophet_lower", "prophet_upper",
                "arima_forecast", "arima_lower", "arima_upper", "is_deviation_flagged"]
        result = result[cols].sort_values([self.cfg.group_col, "month"]).reset_index(drop=True)

        logger.info(
            "Modeled %d groups, skipped %d (insufficient history or fit failure), "
            "flagged %d deviation-months total.",
            n_fit, n_skipped, n_flagged_total,
        )
        return result

    def save_models(self, path: str) -> None:
        """
        Pickle every fitted per-group model (both Prophet and ARIMA/SARIMAX
        objects, verified picklable) plus the config used to fit them, so
        a later session can reload and forecast new periods WITHOUT
        re-fitting 700+ models from scratch.

        Call this only after fit_predict() has populated self.models_.
        """
        if not self.models_:
            raise RuntimeError("No fitted models to save -- call fit_predict() first.")
        payload = {"config": asdict(self.cfg), "models": self.models_}
        with open(path, "wb") as f:
            pickle.dump(payload, f)
        logger.info("Saved %d groups' models -> %s", len(self.models_), path)

    @classmethod
    def load_models(cls, path: str) -> "FundUtilizationForecaster":
        """
        Reload a FundUtilizationForecaster with its fitted models restored
        from a .pkl file written by save_models(). The returned instance's
        `.models_[group]["prophet"]` / `["arima"]` are the exact fitted
        model objects, ready to call `.predict(...)` / `.get_forecast(...)`
        on directly without re-fitting.
        """
        with open(path, "rb") as f:
            payload = pickle.load(f)
        instance = cls(config=FundUtilizationConfig(**payload["config"]))
        instance.models_ = payload["models"]
        logger.info("Loaded %d groups' models <- %s", len(instance.models_), path)
        return instance

    def forecast_from_saved(self, group, periods: Optional[int] = None) -> pd.DataFrame:
        """
        Use an already-fitted, already-loaded model pair for one group to
        forecast `periods` months beyond its training data, without
        re-fitting. Useful after load_models() when only NEW forecasts are
        needed (e.g. a dashboard refreshing next month's expected spend).
        """
        if group not in self.models_:
            raise KeyError(f"No fitted model found for group={group!r}.")
        periods = periods or self.cfg.forecast_horizon
        prophet_model = self.models_[group]["prophet"]
        arima_model = self.models_[group]["arima"]
        if prophet_model is None or arima_model is None:
            raise RuntimeError(f"group={group!r} has no successfully fitted models (insufficient "
                                f"history or fit failure at training time).")

        future = prophet_model.make_future_dataframe(periods=periods, freq=self.cfg.freq)
        prophet_fc = prophet_model.predict(future).tail(periods)[["ds", "yhat", "yhat_lower", "yhat_upper"]]

        alpha = 1 - self.cfg.interval_width
        arima_fc = arima_model.get_forecast(steps=periods)
        arima_ci = arima_fc.conf_int(alpha=alpha)

        return pd.DataFrame({
            "month": prophet_fc["ds"].to_numpy(),
            "prophet_forecast": prophet_fc["yhat"].to_numpy(),
            "prophet_lower": prophet_fc["yhat_lower"].to_numpy(),
            "prophet_upper": prophet_fc["yhat_upper"].to_numpy(),
            "arima_forecast": arima_fc.predicted_mean.to_numpy(),
            "arima_lower": arima_ci.iloc[:, 0].to_numpy(),
            "arima_upper": arima_ci.iloc[:, 1].to_numpy(),
        })


if __name__ == "__main__":
    import sys

    input_csv = sys.argv[1] if len(sys.argv) > 1 else "fund_expenditures.csv"
    output_csv = sys.argv[2] if len(sys.argv) > 2 else "fund_utilization_output.csv"
    group_col = sys.argv[3] if len(sys.argv) > 3 else "MP Name"
    models_pkl = sys.argv[4] if len(sys.argv) > 4 else "fund_utilization_models.pkl"

    print(f"Loading {input_csv} (grouping by '{group_col}') ...")
    df = pd.read_csv(input_csv)

    cfg = FundUtilizationConfig(group_col=group_col)
    forecaster = FundUtilizationForecaster(config=cfg)
    result = forecaster.fit_predict(df)
    result.to_csv(output_csv, index=False)
    forecaster.save_models(models_pkl)

    print(f"\nSaved CSV output -> {output_csv}")
    print(f"Saved fitted models -> {models_pkl}")
    print(f"Rows: {len(result)}  |  Flagged deviation-months: {int(result['is_deviation_flagged'].sum())}")
    print("\nSample flagged rows:")
    print(result[result["is_deviation_flagged"]].head(10).to_string(index=False))
