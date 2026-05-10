import numpy as np
from ml import loader
from services.forecast_service import forecast_n_months


# ─────────────────────────────────────────
# Warm-up helpers
# ─────────────────────────────────────────

def _data_end() -> int:
    return int(loader.master_df["Date_YYYYMM"].max())


def _add_months(yyyymm: int, n: int) -> int:
    year, month = divmod(yyyymm, 100)
    month += n
    while month > 12:
        month -= 12
        year += 1
    return year * 100 + month


def _months_gap(start: int, target: int) -> int:
    """Months from start (inclusive) to target (exclusive)."""
    sy, sm = divmod(start, 100)
    ty, tm = divmod(target, 100)
    return max(0, (ty - sy) * 12 + (tm - sm))


def _warmed_forecast(
    hs_code: str,
    target_yyyymm: int,
    n_months: int,
    pkr: float,
    oil: float,
    conf: float,
) -> list[dict]:
    """
    Warm up from data_end+1 through target_yyyymm-1, building realistic lag
    features via chained predictions, then return the n_months results
    starting at target_yyyymm.

    Without warm-up, predictions for months past the dataset end fall back to
    hist_mean for every lag feature, making macro sensitivity invisible.
    """
    data_end     = _data_end()
    warmup_start = _add_months(data_end, 1)     # e.g. 202601
    gap          = _months_gap(warmup_start, target_yyyymm)  # e.g. 4 for May-2026 target

    if gap > 0:
        total  = gap + n_months
        all_fc = forecast_n_months(hs_code, warmup_start, total, pkr, oil, conf)
        return all_fc[-n_months:] if len(all_fc) >= n_months else all_fc
    else:
        # target is at or before data boundary — no warm-up needed
        return forecast_n_months(hs_code, target_yyyymm, n_months, pkr, oil, conf)


# ─────────────────────────────────────────
# Scenario functions
# ─────────────────────────────────────────

def run_single_variable_scenario(
    hs_code: str,
    target_yyyymm: int,
    n_months: int,
    variable: str,
    range_min: float,
    range_max: float,
    steps: int,
    fixed_pkr: float,
    fixed_oil: float,
    fixed_conf: float
) -> tuple[list[dict], float, str, str]:
    """
    Vary one macro variable across a range, hold the other two fixed.
    Returns (points, slope_per_unit, sensitivity_label, annotation).
    """
    values = np.linspace(range_min, range_max, steps)
    points = []

    for v in values:
        pkr  = float(v) if variable == "pkr"  else fixed_pkr
        oil  = float(v) if variable == "oil"  else fixed_oil
        conf = float(v) if variable == "conf" else fixed_conf

        forecast = _warmed_forecast(hs_code, target_yyyymm, n_months, pkr, oil, conf)
        avg_pred = sum(f["predicted_m"] for f in forecast) / len(forecast)
        points.append({
            "input_value": round(float(v), 2),
            "predicted_m": round(avg_pred, 3)
        })

    # Linear slope
    x = [p["input_value"] for p in points]
    y = [p["predicted_m"] for p in points]
    slope = float(np.polyfit(x, y, 1)[0])

    # Sensitivity label based on absolute % change across range
    y_range_pct = abs(max(y) - min(y)) / (sum(y) / len(y)) * 100 if sum(y) > 0 else 0
    if y_range_pct > 20:
        sensitivity_label = "High"
    elif y_range_pct > 8:
        sensitivity_label = "Medium"
    else:
        sensitivity_label = "Low"

    # Human-readable annotation
    unit_labels = {"pkr": "PKR", "oil": "$/bbl", "conf": "points"}
    unit = unit_labels.get(variable, variable)
    direction = "increases" if slope > 0 else "decreases"
    annotation = (
        f"Every 10 {unit} move {direction} exports by "
        f"${abs(round(slope * 10, 2))}M on average"
    )

    return points, round(slope, 4), sensitivity_label, annotation


def run_multi_variable_scenario(
    hs_code: str,
    target_yyyymm: int,
    n_months: int,
    pkr_values: list[float],
    oil_values: list[float],
    fixed_conf: float
) -> tuple[dict, dict, dict]:
    """
    Vary PKR × Oil simultaneously.
    Returns (matrix, best_scenario, worst_scenario).
    matrix shape: {pkr: {oil: predicted_m}}
    """
    matrix: dict = {}
    all_results = []

    for pkr in pkr_values:
        matrix[pkr] = {}
        for oil in oil_values:
            forecast = _warmed_forecast(hs_code, target_yyyymm, n_months, pkr, oil, fixed_conf)
            avg = round(sum(f["predicted_m"] for f in forecast) / len(forecast), 3)
            matrix[pkr][oil] = avg
            all_results.append({"pkr": pkr, "oil": oil, "predicted_m": avg})

    best  = max(all_results, key=lambda x: x["predicted_m"])
    worst = min(all_results, key=lambda x: x["predicted_m"])

    return matrix, best, worst
