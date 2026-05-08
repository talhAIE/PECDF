import httpx
from langchain_core.tools import tool

BASE_URL = "http://localhost:8000"
TIMEOUT = 30.0


def _post(path: str, body: dict, token: str) -> dict:
    r = httpx.post(
        f"{BASE_URL}{path}",
        json=body,
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT
    )
    r.raise_for_status()
    return r.json()


def _get(path: str, params: dict = None) -> dict:
    r = httpx.get(f"{BASE_URL}{path}", params=params, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def get_tools(bearer_token: str, macro_pkr: float, macro_oil: float, macro_conf: float):
    """
    Returns a list of LangChain tools with the bearer token and macro values
    baked in via closures. Call this once per agent session.
    """

    @tool
    def forecast_commodity(hs_code: str, start_yyyymm: int, n_months: int) -> str:
        """
        Forecast export demand for a single commodity over multiple months.
        Use when user asks for a forecast, outlook, or prediction for a specific commodity.
        hs_code examples: '1006'=Rice, '1207'=Oil Seeds, '2523'=Cement,
        '5205'=Cotton Yarn, '6110'=Winter Wear, '6203'=Mens Suits,
        '6302'=Bed Linens, '7403'=Copper, '9018'=Medical Instr, '9506'=Sports Goods
        """
        try:
            data = _post("/forecast/multi-horizon", {
                "hs_code": hs_code, "start_yyyymm": start_yyyymm, "n_months": n_months,
                "macro": {"usd_pkr": macro_pkr, "brent_oil": macro_oil, "us_confidence": macro_conf}
            }, bearer_token)
            fc = data.get("forecast", [])
            lines = [f"  {p['month']}: ${p['predicted_m']}M (range ${p['lower_bound']}–${p['upper_bound']}M)" for p in fc]
            return (f"Forecast for {data.get('commodity')} ({n_months} month(s)):\n"
                    + "\n".join(lines)
                    + f"\nTotal: ${data.get('total_predicted_m')}M")
        except Exception as e:
            return f"Error: {str(e)}"

    @tool
    def forecast_all_commodities(target_yyyymm: int) -> str:
        """
        Get one-month forecast for all 10 commodities ranked by predicted export value.
        Use when user asks which commodity has the best outlook or to compare all commodities.
        """
        try:
            data = _post("/forecast/all-commodities", {
                "target_yyyymm": target_yyyymm,
                "macro": {"usd_pkr": macro_pkr, "brent_oil": macro_oil, "us_confidence": macro_conf}
            }, bearer_token)
            lines = [f"  {c['rank']}. {c['commodity']}: ${c['predicted_m']}M" for c in data.get("commodities", [])]
            return (f"All commodities forecast for {target_yyyymm}:\n"
                    + "\n".join(lines)
                    + f"\nTotal portfolio: ${data.get('total_m')}M")
        except Exception as e:
            return f"Error: {str(e)}"

    @tool
    def run_scenario(hs_code: str, target_yyyymm: int, variable: str,
                     range_min: float, range_max: float) -> str:
        """
        Run what-if scenario by varying one macro variable across a range.
        variable must be one of: 'pkr', 'oil', 'conf'.
        Use when user asks 'what if PKR hits X' or 'what happens if oil drops to Y'.
        """
        try:
            data = _post("/scenario/single-variable", {
                "hs_code": hs_code, "target_yyyymm": target_yyyymm,
                "variable": variable, "range_min": range_min, "range_max": range_max,
                "fixed_pkr": macro_pkr, "fixed_oil": macro_oil, "fixed_conf": macro_conf
            }, bearer_token)
            pts = data.get("points", [])
            sample = [f"  {variable.upper()}={p['input_value']}: ${p['predicted_m']}M"
                      for p in pts[::max(1, len(pts) // 5)]]
            return (f"Scenario for {data.get('commodity')} — varying {variable}:\n"
                    + "\n".join(sample)
                    + f"\n{data.get('annotation')} | Sensitivity: {data.get('sensitivity_label')}")
        except Exception as e:
            return f"Error: {str(e)}"

    @tool
    def get_seasonality(hs_code: str) -> str:
        """
        Get historical seasonal patterns for a commodity (best/worst months).
        Use when user asks about peak seasons, best time to export, or seasonal trends.
        """
        try:
            data = _get(f"/seasonality/{hs_code}")
            avgs = data.get("monthly_averages", {})
            top3 = sorted(avgs.items(), key=lambda x: x[1], reverse=True)[:3]
            return (f"Seasonality for {data.get('commodity')}:\n"
                    f"Peak: {data.get('peak_month_name')} | Trough: {data.get('trough_month_name')}\n"
                    f"Strength: {data.get('seasonality_strength')}%\n"
                    f"Top 3 months: {[(m, f'${v}M') for m, v in top3]}")
        except Exception as e:
            return f"Error: {str(e)}"

    @tool
    def get_momentum() -> str:
        """
        Get 3-month and 6-month export momentum for all 10 commodities.
        Use when user asks which commodities are trending up or down.
        """
        try:
            data = _get("/momentum")
            lines = [
                f"  {c['commodity']}: {c['direction'].upper()} "
                f"(3M: {c['momentum_3m_pct']:+.1f}%, 6M: {c['momentum_6m_pct']:+.1f}%) "
                f"last=${c['last_actual_m']}M"
                for c in data.get("commodities", [])
            ]
            return "Current momentum:\n" + "\n".join(lines)
        except Exception as e:
            return f"Error: {str(e)}"

    @tool
    def get_historical(hs_code: str, months: int = 12) -> str:
        """
        Get last N months of actual export data for a commodity.
        Use when user asks about historical performance or past trends.
        """
        try:
            data = _get(f"/historical/{hs_code}", {"months": months})
            rows = data.get("data", [])
            lines = [f"  {r['month']}: ${r['export_value_m']}M" for r in rows]
            return f"Historical ({data.get('commodity')}, last {months}M):\n" + "\n".join(lines)
        except Exception as e:
            return f"Error: {str(e)}"

    @tool
    def get_currency_sensitivity(target_yyyymm: int) -> str:
        """
        Get PKR currency sensitivity ranking for all commodities.
        Use when user asks which exports are most affected by PKR depreciation.
        """
        try:
            data = _get("/sensitivity/currency", {"target_yyyymm": target_yyyymm, "pkr_min": 260, "pkr_max": 330})
            lines = [
                f"  #{c['sensitivity_rank']} {c['commodity']}: "
                f"{c['change_per_10pkr_m']:+.3f}M per 10 PKR ({c['direction']})"
                for c in data.get("commodities", [])
            ]
            return "PKR sensitivity (most to least):\n" + "\n".join(lines)
        except Exception as e:
            return f"Error: {str(e)}"

    @tool
    def compare_commodities(hs_code_a: str, hs_code_b: str,
                            start_yyyymm: int, n_months: int) -> str:
        """
        Compare forecast for two commodities side by side.
        Use when user asks to compare two specific commodities.
        """
        try:
            results = {}
            for hs in [hs_code_a, hs_code_b]:
                data = _post("/forecast/multi-horizon", {
                    "hs_code": hs, "start_yyyymm": start_yyyymm, "n_months": n_months,
                    "macro": {"usd_pkr": macro_pkr, "brent_oil": macro_oil, "us_confidence": macro_conf}
                }, bearer_token)
                results[hs] = data
            lines = ["Comparison:"]
            for hs, data in results.items():
                lines.append(f"\n{data.get('commodity')} — {n_months}M total: ${data.get('total_predicted_m')}M")
                for pt in data.get("forecast", []):
                    lines.append(f"  {pt['month']}: ${pt['predicted_m']}M")
            return "\n".join(lines)
        except Exception as e:
            return f"Error: {str(e)}"

    return [
        forecast_commodity,
        forecast_all_commodities,
        run_scenario,
        get_seasonality,
        get_momentum,
        get_historical,
        get_currency_sensitivity,
        compare_commodities,
    ]
