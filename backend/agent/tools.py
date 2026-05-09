"""
Agent tools — all YYYYMM and count parameters are declared as str to match
what Groq's Llama model actually generates. We coerce to int inside each
function so the backend receives proper types.
"""
import httpx
from datetime import date
from langchain_core.tools import tool
from duckduckgo_search import DDGS

BASE_URL = "http://localhost:8000"
TIMEOUT  = 30.0


def _current_yyyymm() -> int:
    """Return today's year-month as YYYYMM integer, e.g. 202605."""
    today = date.today()
    return today.year * 100 + today.month


def _post(path: str, body: dict, token: str) -> dict:
    r = httpx.post(
        f"{BASE_URL}{path}",
        json=body,
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


def _get(path: str, params: dict | None = None) -> dict:
    r = httpx.get(f"{BASE_URL}{path}", params=params, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def _safe_int(value, default: int) -> int:
    """Coerce a string/int/float to int, falling back to default."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ── Web search — DuckDuckGo (no API key) ─────────────────────────────────────

@tool
def web_search(query: str) -> str:
    """
    Search the web for REAL-TIME EXTERNAL information ONLY.
    Use ONLY for:
      - Current live market prices (today's USD/PKR rate, current oil price)
      - Breaking trade news or policy updates not in training data
      - General world knowledge questions unrelated to PECDF system data

    Do NOT use for: commodity MAPE values, HS codes, model metrics, seasonal
    patterns, momentum, or anything already available via other tools.
    """
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=4))
        if not results:
            return "No web results found for this query."
        parts = [
            f"**{r.get('title', '')}**\n{r.get('body', '')}\nSource: {r.get('href', '')}"
            for r in results
        ]
        return "\n\n---\n\n".join(parts)
    except Exception as e:
        return f"Web search unavailable: {str(e)}. Try rephrasing or use a different tool."


# ── Forecast tools ────────────────────────────────────────────────────────────

def get_tools(bearer_token: str, macro_pkr: float, macro_oil: float, macro_conf: float):
    """
    Returns all agent tools with bearer token and macro inputs baked in via
    closures. All YYYYMM and numeric params are str-typed so Groq's schema
    validation passes, then coerced to int inside each function.
    """
    current_month = _current_yyyymm()

    @tool
    def forecast_commodity(hs_code: str, n_months: str, start_yyyymm: str = "") -> str:
        """
        Forecast export demand for a single Pakistan commodity over N months.

        Parameters:
          hs_code     : HS code string — '1006'=Rice, '1207'=Oil Seeds, '2523'=Cement,
                        '5205'=Cotton Yarn, '6110'=Winter Wear, '6203'=Mens Suits,
                        '6302'=Bed Linens, '7403'=Copper, '9018'=Medical Instr, '9506'=Sports Goods
          n_months    : how many months to forecast as a string, e.g. '3' or '6'
          start_yyyymm: start month in YYYYMM format as string, e.g. '202605'.
                        Leave blank or '0' to use the current month automatically.

        Use for: forecast, outlook, prediction, projection for a specific commodity.
        """
        try:
            n   = _safe_int(n_months, 3)
            start = _safe_int(start_yyyymm, 0)
            if start < 202000:          # blank / invalid → default to current month
                start = current_month

            data = _post("/forecast/multi-horizon", {
                "hs_code":       hs_code,
                "start_yyyymm":  start,
                "n_months":      n,
                "macro": {
                    "usd_pkr":       macro_pkr,
                    "brent_oil":     macro_oil,
                    "us_confidence": macro_conf,
                },
            }, bearer_token)

            fc    = data.get("forecast", [])
            lines = [
                f"  {p['month']}: ${p['predicted_m']}M "
                f"(range ${p['lower_bound']}–${p['upper_bound']}M)"
                for p in fc
            ]
            return (
                f"Forecast for {data.get('commodity')} "
                f"(starting {start}, {n} months):\n"
                + "\n".join(lines)
                + f"\nTotal over {n} months: ${data.get('total_predicted_m')}M"
            )
        except httpx.HTTPStatusError as e:
            return f"Forecast API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Forecast error: {str(e)}"

    @tool
    def forecast_all_commodities(target_yyyymm: str = "") -> str:
        """
        Get a one-month export forecast for ALL 10 Pakistan commodities ranked by value.

        Parameters:
          target_yyyymm: month in YYYYMM format as string, e.g. '202605'.
                         Leave blank or '0' to use the current month automatically.

        Use for: portfolio overview, best-performing commodity, all-commodities comparison.
        """
        try:
            month = _safe_int(target_yyyymm, 0)
            if month < 202000:
                month = current_month

            data  = _post("/forecast/all-commodities", {
                "target_yyyymm": month,
                "macro": {
                    "usd_pkr":       macro_pkr,
                    "brent_oil":     macro_oil,
                    "us_confidence": macro_conf,
                },
            }, bearer_token)

            lines = [
                f"  {c['rank']}. {c['commodity']}: ${c['predicted_m']}M"
                for c in data.get("commodities", [])
            ]
            return (
                f"All-commodities forecast for {month}:\n"
                + "\n".join(lines)
                + f"\nTotal portfolio: ${data.get('total_m')}M"
            )
        except httpx.HTTPStatusError as e:
            return f"API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Forecast-all error: {str(e)}"

    @tool
    def run_scenario(
        hs_code: str,
        variable: str,
        range_min: str,
        range_max: str,
        target_yyyymm: str = "",
    ) -> str:
        """
        Run a what-if sensitivity scenario by varying ONE macro variable across a range.

        Parameters:
          hs_code      : commodity HS code string, e.g. '9018' for Medical Instruments
          variable     : which macro to vary — MUST be exactly one of: 'pkr', 'oil', 'conf'
          range_min    : lower bound of the sweep as string, e.g. '250' for PKR
          range_max    : upper bound of the sweep as string, e.g. '350' for PKR
          target_yyyymm: month in YYYYMM as string, e.g. '202605'. Leave blank for current month.

        Use for: 'what if PKR hits 320?', 'what happens if oil drops to 60?', sensitivity analysis.
        Typical ranges: pkr 250-350 | oil 40-130 | conf 70-140
        """
        try:
            month  = _safe_int(target_yyyymm, 0)
            if month < 202000:
                month = current_month
            rmin = float(range_min)
            rmax = float(range_max)

            data = _post("/scenario/single-variable", {
                "hs_code":       hs_code,
                "target_yyyymm": month,
                "variable":      variable,
                "range_min":     rmin,
                "range_max":     rmax,
                "fixed_pkr":     macro_pkr,
                "fixed_oil":     macro_oil,
                "fixed_conf":    macro_conf,
            }, bearer_token)

            pts    = data.get("points", [])
            sample = [
                f"  {variable.upper()}={p['input_value']:.1f}: ${p['predicted_m']}M"
                for p in pts[::max(1, len(pts) // 6)]
            ]
            return (
                f"Scenario — {data.get('commodity')}, varying {variable} "
                f"from {rmin} to {rmax}:\n"
                + "\n".join(sample)
                + f"\n→ {data.get('annotation')}"
                + f"\n→ Sensitivity: {data.get('sensitivity_label')}"
                + f"\n→ Effect per unit: {data.get('slope_per_unit')} $M"
            )
        except httpx.HTTPStatusError as e:
            return f"Scenario API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Scenario error: {str(e)}"

    @tool
    def get_seasonality(hs_code: str) -> str:
        """
        Get monthly seasonality patterns for one commodity — peak month, trough month,
        seasonal strength %, and average export value by month of year.

        Use for: peak season, best month to export, seasonal trends, off-peak planning.
        """
        try:
            data = _get(f"/seasonality/{hs_code}")
            avgs = data.get("monthly_averages", {})
            top3 = sorted(avgs.items(), key=lambda x: x[1], reverse=True)[:3]
            top3_str = ", ".join(f"Month {m}: ${v:.1f}M" for m, v in top3)
            return (
                f"Seasonality — {data.get('commodity')}:\n"
                f"  Peak month  : {data.get('peak_month_name')} "
                f"(avg ${avgs.get(str(data.get('peak_month')), 0):.1f}M)\n"
                f"  Trough month: {data.get('trough_month_name')} "
                f"(avg ${avgs.get(str(data.get('trough_month')), 0):.1f}M)\n"
                f"  Strength    : {data.get('seasonality_strength')}%\n"
                f"  Top 3 months: {top3_str}"
            )
        except httpx.HTTPStatusError as e:
            return f"Seasonality API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Seasonality error: {str(e)}"

    @tool
    def get_momentum() -> str:
        """
        Get 3-month and 6-month export momentum for all 10 Pakistan commodities.
        Returns direction (UP/DOWN), percentage change, and latest actual value.

        Use for: trending commodities, momentum leaders, which exports are growing/falling.
        """
        try:
            data  = _get("/momentum")
            lines = [
                f"  {c['commodity']}: {c['direction'].upper()} "
                f"(3M: {c['momentum_3m_pct']:+.1f}%, 6M: {c['momentum_6m_pct']:+.1f}%) "
                f"last actual: ${c['last_actual_m']}M"
                for c in data.get("commodities", [])
            ]
            return "Current momentum (all commodities):\n" + "\n".join(lines)
        except httpx.HTTPStatusError as e:
            return f"Momentum API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Momentum error: {str(e)}"

    @tool
    def get_historical(hs_code: str, months: str = "12") -> str:
        """
        Get the last N months of actual export data for a commodity from the master dataset.

        Parameters:
          hs_code: commodity HS code string, e.g. '6302' for Bed Linens
          months : number of months of history as string, e.g. '12' or '24'

        Use for: historical performance, past trends, year-over-year analysis.
        """
        try:
            n    = _safe_int(months, 12)
            data = _get(f"/historical/{hs_code}", {"months": n})
            rows = data.get("data", [])
            lines = [f"  {r['month']}: ${r['export_value_m']}M" for r in rows]
            return (
                f"Historical data — {data.get('commodity')} (last {n} months):\n"
                + "\n".join(lines)
            )
        except httpx.HTTPStatusError as e:
            return f"Historical API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Historical error: {str(e)}"

    @tool
    def get_currency_sensitivity(target_yyyymm: str = "") -> str:
        """
        Rank all 10 commodities by how sensitive their exports are to USD/PKR changes.
        Shows $M change per 10 PKR movement for each commodity.

        Use for: PKR depreciation impact, currency risk, which exports benefit from weak PKR.
        """
        try:
            month = _safe_int(target_yyyymm, 0)
            if month < 202000:
                month = current_month

            data  = _get("/sensitivity/currency", {
                "target_yyyymm": month,
                "pkr_min": 260,
                "pkr_max": 330,
            })
            lines = [
                f"  #{c['sensitivity_rank']} {c['commodity']}: "
                f"{c['change_per_10pkr_m']:+.3f}M per 10 PKR ({c['direction']})"
                for c in data.get("commodities", [])
            ]
            return "PKR sensitivity ranking (most to least sensitive):\n" + "\n".join(lines)
        except httpx.HTTPStatusError as e:
            return f"Sensitivity API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Sensitivity error: {str(e)}"

    @tool
    def compare_commodities(
        hs_code_a: str,
        hs_code_b: str,
        n_months: str = "3",
        start_yyyymm: str = "",
    ) -> str:
        """
        Compare forecasts for two commodities side by side over N months.

        Parameters:
          hs_code_a   : first commodity HS code string, e.g. '6302'
          hs_code_b   : second commodity HS code string, e.g. '9018'
          n_months    : forecast horizon as string, e.g. '3' or '6'
          start_yyyymm: start month in YYYYMM as string. Leave blank for current month.

        Use for: direct commodity comparisons, which is better outlook, trade-off analysis.
        """
        try:
            n     = _safe_int(n_months, 3)
            start = _safe_int(start_yyyymm, 0)
            if start < 202000:
                start = current_month

            lines = ["Side-by-side comparison:"]
            for hs in [hs_code_a, hs_code_b]:
                data = _post("/forecast/multi-horizon", {
                    "hs_code":       hs,
                    "start_yyyymm":  start,
                    "n_months":      n,
                    "macro": {
                        "usd_pkr":       macro_pkr,
                        "brent_oil":     macro_oil,
                        "us_confidence": macro_conf,
                    },
                }, bearer_token)
                lines.append(
                    f"\n{data.get('commodity')} — {n}M total: "
                    f"${data.get('total_predicted_m')}M"
                )
                for pt in data.get("forecast", []):
                    lines.append(f"  {pt['month']}: ${pt['predicted_m']}M")

            return "\n".join(lines)
        except httpx.HTTPStatusError as e:
            return f"Compare API error {e.response.status_code}: {e.response.text[:200]}"
        except Exception as e:
            return f"Compare error: {str(e)}"

    return [
        forecast_commodity,
        forecast_all_commodities,
        run_scenario,
        get_seasonality,
        get_momentum,
        get_historical,
        get_currency_sensitivity,
        compare_commodities,
        web_search,
    ]
