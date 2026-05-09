import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml import loader
from llm_runtime import chat_completion_text


def generate_report(
    scope: str,
    horizon: int,
    usd_pkr: float,
    brent_oil: float,
    us_conf: float,
    tone: str,
    forecast_data: list[dict],
    seasonality_data: list[dict],
    momentum_data: list[dict]
) -> str:
    """
    Generate export outlook report via configured LLM (Groq or OpenAI).
    All data is pre-fetched by the router before calling this function.
    """

    tone_instruction = (
        "Write in plain business English. No ML jargon. "
        "Do not mention MAPE, R², or technical model details."
        if tone == "executive"
        else
        "Include technical model metrics where relevant. "
        f"The model is XGBoost with overall MAPE={loader.test_mape}% and R²={loader.test_r2}."
    )

    commodity_info = "\n".join(
        f"- {loader.HS_LABELS.get(str(r.get('hs_code', '')), r.get('commodity', ''))}: "
        f"predicted ${r.get('total_predicted_m', r.get('predicted_m', 'N/A'))}M "
        f"over {horizon} month(s)"
        for r in forecast_data
    )

    seasonality_highlights = "\n".join(
        f"- {s['commodity']}: peak in {s['peak_month_name']}, "
        f"trough in {s['trough_month_name']} "
        f"(strength: {s['seasonality_strength']}%)"
        for s in seasonality_data[:5]
    )

    momentum_highlights = "\n".join(
        f"- {m['commodity']}: {m['direction'].upper()} "
        f"({m['momentum_3m_pct']:+.1f}% over 3 months)"
        for m in momentum_data
    )

    prompt = f"""You are a senior Pakistan trade analyst.
Write a professional export outlook report based on the data below.

{tone_instruction}

MACRO ASSUMPTIONS:
- USD/PKR Exchange Rate: {usd_pkr}
- Brent Crude Oil: ${brent_oil}/barrel
- US Consumer Confidence Index: {us_conf}
- Forecast Horizon: {horizon} month(s)

COMMODITY FORECASTS:
{commodity_info}

SEASONALITY INSIGHTS:
{seasonality_highlights}

MOMENTUM:
{momentum_highlights}

Write the report with these exact sections:
1. EXECUTIVE SUMMARY (2-3 paragraphs: overall outlook, key risks, macro context)
2. COMMODITY FORECASTS (one paragraph per commodity: predicted value, confidence, trend)
3. SEASONAL CONSIDERATIONS (which commodities are entering peak/off-peak season)
4. KEY RISK FACTORS (macro risks: PKR trajectory, oil prices, US demand)
5. RECOMMENDATIONS (actionable guidance for exporters)

Keep the tone professional and concise. Use USD millions (e.g. $42.5M) for all values."""

    return chat_completion_text(prompt, max_tokens=None)
