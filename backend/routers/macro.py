import logging

import httpx
from fastapi import APIRouter
from config import settings

router = APIRouter(prefix="/macro", tags=["Macro"])
logger = logging.getLogger(__name__)

YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}


async def _yahoo_price(symbol: str) -> float | None:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, headers=YAHOO_HEADERS, params={"interval": "1d", "range": "1d"})
            r.raise_for_status()
            data = r.json()
            price = data["chart"]["result"][0]["meta"]["regularMarketPrice"]
            return round(float(price), 2)
    except Exception:
        return None


async def _fred_latest(series_id: str, limit: int = 6) -> float | None:
    api_key = getattr(settings, "fred_api_key", "") or ""
    if not api_key.strip():
        return None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                "https://api.stlouisfed.org/fred/series/observations",
                params={
                    "series_id": series_id,
                    "api_key": api_key.strip(),
                    "file_type": "json",
                    "sort_order": "desc",
                    "limit": limit,
                },
            )
            r.raise_for_status()
            body = r.json()
            for obs in body.get("observations") or []:
                val = obs.get("value", ".")
                if val not in (None, "", "."):
                    try:
                        return round(float(val), 1)
                    except (TypeError, ValueError):
                        continue
            return None
    except Exception as ex:
        logger.warning("FRED observation fetch failed for %s: %s", series_id, ex)
        return None


@router.get("/live")
async def get_live_macro():
    """
    Fetch real-time macro values:
    - USD/PKR: Yahoo Finance (USDPKR=X)
    - Brent Crude: Yahoo Finance (BZ=F)
    - US Consumer Confidence (UMCSENT): FRED API — requires FRED_API_KEY in .env
    Returns null for any value that can't be fetched (frontend keeps existing value).
    """
    import asyncio
    usd_pkr, brent_oil, us_confidence = await asyncio.gather(
        _yahoo_price("USDPKR=X"),
        _yahoo_price("BZ=F"),
        _fred_latest("UMCSENT"),
    )
    fred_on = bool((getattr(settings, "fred_api_key", "") or "").strip())
    return {
        "usd_pkr":       usd_pkr,
        "brent_oil":     brent_oil,
        "us_confidence": us_confidence,
        "sources": {
            "usd_pkr":       "Yahoo Finance — USDPKR=X",
            "brent_oil":     "Yahoo Finance — BZ=F (Brent Crude Futures)",
            "us_confidence": "FRED — UMCSENT (U. Michigan Consumer Sentiment)",
        },
        # Lets the UI confirm what actually updated (vs stale manual values)
        "fetched_ok": {
            "usd_pkr":       usd_pkr is not None,
            "brent_oil":     brent_oil is not None,
            "us_confidence": us_confidence is not None,
        },
        "fred_api_configured": fred_on,
        "us_confidence_note": (
            "Live from FRED UMCSENT (latest published month)."
            if us_confidence is not None
            else (
                "No FRED_API_KEY in .env — US confidence is not fetched live."
                if not fred_on
                else "FRED returned no numeric observation — check key or try again later."
            )
        ),
    }
