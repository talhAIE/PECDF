import numpy as np
import pandas as pd
from ml import loader
from services.forecast_service import forecast_n_months, make_prediction

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December"
}


def get_seasonality(hs_code: str) -> dict:
    """Historical average export per calendar month (Jan–Dec)."""
    df = loader.master_df[loader.master_df["HS_Code"] == str(hs_code)].copy()
    monthly = df.groupby("Month")["Export_Value_USD"].mean()
    monthly_m = (monthly / 1e6).round(3)

    peak_month = int(monthly_m.idxmax())
    trough_month = int(monthly_m.idxmin())
    mean_val = float(monthly_m.mean())
    strength = round((float(monthly_m.max()) - float(monthly_m.min())) / mean_val * 100, 1) if mean_val > 0 else 0.0

    return {
        "hs_code":              str(hs_code),
        "commodity":            loader.HS_LABELS.get(str(hs_code), hs_code),
        "monthly_averages":     {str(k): round(float(v), 3) for k, v in monthly_m.items()},
        "peak_month":           peak_month,
        "trough_month":         trough_month,
        "peak_month_name":      MONTH_NAMES[peak_month],
        "trough_month_name":    MONTH_NAMES[trough_month],
        "seasonality_strength": strength,
    }


def get_all_seasonality() -> list[dict]:
    return [get_seasonality(hs) for hs in loader.hs_categories]


def get_momentum(hs_code: str | None = None) -> list[dict]:
    """3-month and 6-month export momentum for one or all commodities."""
    codes = [str(hs_code)] if hs_code else loader.hs_categories
    results = []

    for hs in codes:
        df = (
            loader.master_df[loader.master_df["HS_Code"] == hs]
            .sort_values("Date_YYYYMM")
        )
        if len(df) < 7:
            continue

        last     = float(df["Export_Value_USD"].iloc[-1])
        last_month = int(df["Date_YYYYMM"].iloc[-1])
        m3ago    = float(df["Export_Value_USD"].iloc[-4])
        m6ago    = float(df["Export_Value_USD"].iloc[-7])

        mom3 = round((last - m3ago) / m3ago * 100, 1) if m3ago != 0 else 0.0
        mom6 = round((last - m6ago) / m6ago * 100, 1) if m6ago != 0 else 0.0

        direction = "up" if mom3 > 2 else ("down" if mom3 < -2 else "flat")

        results.append({
            "hs_code":         hs,
            "commodity":       loader.HS_LABELS[hs],
            "momentum_3m_pct": mom3,
            "momentum_6m_pct": mom6,
            "direction":       direction,
            "last_actual_m":   round(last / 1e6, 3),
            "last_month":      last_month,
        })

    return results


def get_single_momentum(hs_code: str) -> dict:
    """Momentum + last 12 months of actuals for one commodity."""
    base = get_momentum(hs_code)
    if not base:
        return {}
    result = base[0].copy()

    df = (
        loader.master_df[loader.master_df["HS_Code"] == str(hs_code)]
        .sort_values("Date_YYYYMM")
        .tail(12)
    )
    result["last_12_months"] = [
        {"month": int(row["Date_YYYYMM"]),
         "export_value_m": round(float(row["Export_Value_USD"]) / 1e6, 3)}
        for _, row in df.iterrows()
    ]
    return result


def get_currency_sensitivity(
    target_yyyymm: int,
    n_months: int,
    pkr_min: float,
    pkr_max: float,
    fixed_oil: float,
    fixed_conf: float
) -> list[dict]:
    """
    For all 10 commodities, compute export change per 10 PKR movement.
    """
    pkr_values = np.linspace(pkr_min, pkr_max, 6).tolist()
    results = []

    for hs in loader.hs_categories:
        preds = []
        for pkr in pkr_values:
            fc = forecast_n_months(hs, target_yyyymm, n_months, pkr, fixed_oil, fixed_conf)
            avg = sum(f["predicted_m"] for f in fc) / len(fc)
            preds.append(avg)

        slope_per_10 = float(np.polyfit(pkr_values, preds, 1)[0]) * 10
        results.append({
            "hs_code":            hs,
            "commodity":          loader.HS_LABELS[hs],
            "change_per_10pkr_m": round(slope_per_10, 3),
            "direction":          "increases" if slope_per_10 > 0 else "decreases",
        })

    results.sort(key=lambda x: abs(x["change_per_10pkr_m"]), reverse=True)
    for i, r in enumerate(results):
        r["sensitivity_rank"] = i + 1

    return results


def _month_seriesInclusive(start_yyyymm: int, end_yyyymm: int) -> list[int]:
    """Every calendar month from start_yyyymm through end_yyyymm inclusive."""
    y, m = divmod(start_yyyymm, 100)
    ye, me = divmod(end_yyyymm, 100)
    out: list[int] = []
    cy, cm = y, m
    while (cy < ye) or (cy == ye and cm <= me):
        out.append(cy * 100 + cm)
        cm += 1
        if cm > 12:
            cm = 1
            cy += 1
    return out


def model_fit_vs_actual(hs_code: str, start_yyyymm: int, end_yyyymm: int) -> list[dict]:
    """
    One-step retrospective fit on the champion model:
    For each month, feeds the same macro columns as recorded in Master_FYP_Dataset.csv
    (contemporaneous drivers) plus historical lag features resolved from master_df —
    identical code path as live `make_prediction` / `/forecast`.

    Differs from a 24‑month recursive forecast with today's macro pinned (which hides
    how the model behaved over the real test timeline).
    """
    hs_code = str(hs_code)
    md = loader.master_df
    rows: list[dict] = []
    for yyyymm in _month_seriesInclusive(int(start_yyyymm), int(end_yyyymm)):
        sub = md[(md["HS_Code"] == hs_code) & (md["Date_YYYYMM"] == int(yyyymm))]
        if len(sub) == 0:
            continue
        r = sub.iloc[0]
        pkr = float(r["USD_PKR_Close"])
        oil = float(r["Brent_Oil_Avg"])
        conf = float(r["US_Consumer_Confidence"])
        actual_usd = float(r["Export_Value_USD"])
        pred_usd = make_prediction(hs_code, int(yyyymm), pkr, oil, conf)
        rows.append({
            "month":       int(yyyymm),
            "actual_m":    round(actual_usd / 1e6, 3),
            "predicted_m": round(pred_usd / 1e6, 3),
        })
    return rows


def get_historical(hs_code: str, months: int = 24) -> dict:
    """Last N months of actual export data for one commodity."""
    df = (
        loader.master_df[loader.master_df["HS_Code"] == str(hs_code)]
        .sort_values("Date_YYYYMM")
        .tail(months)
    )
    return {
        "hs_code":          str(hs_code),
        "commodity":        loader.HS_LABELS.get(str(hs_code), hs_code),
        "months_requested": months,
        "data": [
            {"month": int(row["Date_YYYYMM"]),
             "export_value_m": round(float(row["Export_Value_USD"]) / 1e6, 3)}
            for _, row in df.iterrows()
        ]
    }
