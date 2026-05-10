import numpy as np
import pandas as pd
from ml import loader

# Confidence band widens each forecast step (more uncertainty further out)
UNCERTAINTY_GROWTH = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0,
                      2.2, 2.4, 2.6, 2.8, 3.0, 3.2]


# ─────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────

def _subtract_months(yyyymm: int, n: int) -> int:
    """Subtract n months from a YYYYMM integer. E.g. 202601 - 1 = 202512."""
    year, month = divmod(yyyymm, 100)
    month -= n
    while month <= 0:
        month += 12
        year -= 1
    return year * 100 + month


def _get_value_for_month(
    hs_code: str,
    yyyymm: int,
    forecast_buffer: dict
) -> float | None:
    """
    Look up export value for a given commodity + month.
    Checks forecast_buffer first (for chained predictions),
    then falls back to master_df (historical actuals).
    Returns None if the month has no data.
    """
    key = (str(hs_code), int(yyyymm))
    if key in forecast_buffer:
        return forecast_buffer[key]

    row = loader.master_df[
        (loader.master_df["HS_Code"] == str(hs_code)) &
        (loader.master_df["Date_YYYYMM"] == int(yyyymm))
    ]
    if len(row) > 0:
        return float(row["Export_Value_USD"].iloc[0])
    return None


def _compute_rolling_avg(
    hs_code: str,
    yyyymm: int,
    window: int,
    forecast_buffer: dict
) -> float | None:
    """Average of the `window` months immediately before yyyymm."""
    values = []
    for i in range(1, window + 1):
        val = _get_value_for_month(hs_code, _subtract_months(yyyymm, i), forecast_buffer)
        if val is not None:
            values.append(val)
    if len(values) == window:
        return float(np.mean(values))
    return None


# ─────────────────────────────────────────
# Core prediction function
# ─────────────────────────────────────────

def make_prediction(
    hs_code: str,
    target_yyyymm: int,
    usd_pkr: float,
    brent_oil: float,
    us_conf: float,
    forecast_buffer: dict | None = None
) -> float:
    """
    Predict Export_Value_USD for one commodity + one month.

    forecast_buffer: dict keyed by (hs_code, yyyymm) -> predicted USD
                     pass the same dict across recursive calls so
                     month-N predictions feed into month-N+1 lags.
    """
    if forecast_buffer is None:
        forecast_buffer = {}

    hs_code = str(hs_code)
    target_yyyymm = int(target_yyyymm)

    # Date features
    year = target_yyyymm // 100
    month = target_yyyymm % 100
    month_sin = np.sin(2 * np.pi * month / 12)
    month_cos = np.cos(2 * np.pi * month / 12)

    # Lag features
    lag_1m = _get_value_for_month(hs_code, _subtract_months(target_yyyymm, 1), forecast_buffer)
    lag_3m = _get_value_for_month(hs_code, _subtract_months(target_yyyymm, 3), forecast_buffer)
    lag_6m = _get_value_for_month(hs_code, _subtract_months(target_yyyymm, 6), forecast_buffer)

    # Rolling averages
    rolling_3m = _compute_rolling_avg(hs_code, target_yyyymm, 3, forecast_buffer)
    rolling_6m = _compute_rolling_avg(hs_code, target_yyyymm, 6, forecast_buffer)

    # Fallback: use the commodity's historical mean if lags are unavailable
    if any(v is None for v in [lag_1m, lag_3m, lag_6m, rolling_3m, rolling_6m]):
        hist_mean = loader.master_df[
            loader.master_df["HS_Code"] == hs_code
        ]["Export_Value_USD"].mean()
        lag_1m = lag_1m if lag_1m is not None else hist_mean
        lag_3m = lag_3m if lag_3m is not None else hist_mean
        lag_6m = lag_6m if lag_6m is not None else hist_mean
        rolling_3m = rolling_3m if rolling_3m is not None else hist_mean
        rolling_6m = rolling_6m if rolling_6m is not None else hist_mean

    row = pd.DataFrame([{
        "HS_Code":               hs_code,
        "USD_PKR_Close":         usd_pkr,
        "Brent_Oil_Avg":         brent_oil,
        "US_Consumer_Confidence": us_conf,
        "Year":                  year,
        "Month":                 month,
        "Month_Sin":             month_sin,
        "Month_Cos":             month_cos,
        "Lag_1M":                lag_1m,
        "Lag_3M":                lag_3m,
        "Lag_6M":                lag_6m,
        "Rolling_3M_Avg":        rolling_3m,
        "Rolling_6M_Avg":        rolling_6m,
    }])

    # Apply category dtype exactly as during training
    row["HS_Code"] = pd.Categorical(
        row["HS_Code"],
        categories=loader.hs_categories
    )

    row = row[loader.FEATURE_COLS]
    prediction = float(loader.model.predict(row)[0])
    return max(0.0, prediction)     # clamp — no negative exports


# ─────────────────────────────────────────
# Multi-step forecast for one commodity
# ─────────────────────────────────────────

def forecast_n_months(
    hs_code: str,
    start_yyyymm: int,
    n_months: int,
    usd_pkr: float,
    brent_oil: float,
    us_conf: float
) -> list[dict]:
    """
    Recursive multi-step forecast.
    Each month's prediction feeds as Lag_1M into the next month.
    Returns list of ForecastPoint dicts.
    """
    hs_code = str(hs_code)
    forecast_buffer: dict = {}
    results: list[dict] = []

    start_dt = pd.to_datetime(str(start_yyyymm), format="%Y%m")
    commodity_mape = loader.get_commodity_mape(hs_code)

    for i in range(n_months):
        target_dt = start_dt + pd.DateOffset(months=i)
        month_int = int(target_dt.strftime("%Y%m"))

        pred = make_prediction(
            hs_code, month_int,
            usd_pkr, brent_oil, us_conf,
            forecast_buffer
        )
        forecast_buffer[(hs_code, month_int)] = pred

        base_uncert = commodity_mape / 100
        factor = UNCERTAINTY_GROWTH[min(i, len(UNCERTAINTY_GROWTH) - 1)]

        results.append({
            "month":        month_int,
            "predicted_m":  round(pred / 1e6, 3),
            "lower_bound":  round(max(0.0, pred * (1 - base_uncert * factor)) / 1e6, 3),
            "upper_bound":  round(pred * (1 + base_uncert * factor) / 1e6, 3),
            "step":         i + 1,
        })

    return results


# ─────────────────────────────────────────
# Single-month forecast for all commodities
# ─────────────────────────────────────────

def forecast_all_commodities(
    target_yyyymm: int,
    usd_pkr: float,
    brent_oil: float,
    us_conf: float
) -> list[dict]:
    """
    One-month forecast for all 10 commodities, sorted by predicted value desc.
    """
    results = []
    for hs in loader.hs_categories:
        commodity_mape = loader.get_commodity_mape(hs)
        pred = make_prediction(hs, target_yyyymm, usd_pkr, brent_oil, us_conf)
        base_uncert = commodity_mape / 100
        results.append({
            "hs_code":      hs,
            "commodity":    loader.HS_LABELS[hs],
            "predicted_m":  round(pred / 1e6, 3),
            "lower_bound":  round(max(0.0, pred * (1 - base_uncert)) / 1e6, 3),
            "upper_bound":  round(pred * (1 + base_uncert) / 1e6, 3),
        })

    results.sort(key=lambda x: x["predicted_m"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results
