from fastapi import APIRouter, Query, HTTPException
from ml import loader
from schemas.analytics import (
    SeasonalityResponse, AllSeasonalityResponse,
    MomentumResponse, SingleMomentumResponse, MomentumItem,
    CurrencySensitivityResponse, SensitivityItem,
    HistoricalResponse, HistoricalPoint,
    ModelFitResponse, ModelFitPoint,
)
from services import analytics_service

router = APIRouter(tags=["Analytics"])


# ─── Seasonality ────────────────────────

@router.get("/seasonality/all", response_model=AllSeasonalityResponse)
def all_seasonality():
    data = analytics_service.get_all_seasonality()
    return AllSeasonalityResponse(commodities=[SeasonalityResponse(**d) for d in data])


@router.get("/seasonality/{hs_code}", response_model=SeasonalityResponse)
def commodity_seasonality(hs_code: str):
    if hs_code not in loader.hs_categories:
        raise HTTPException(status_code=404, detail=f"Unknown HS code: {hs_code}")
    return SeasonalityResponse(**analytics_service.get_seasonality(hs_code))


# ─── Momentum ───────────────────────────

@router.get("/momentum", response_model=MomentumResponse)
def all_momentum():
    data = analytics_service.get_momentum()
    return MomentumResponse(commodities=[MomentumItem(**d) for d in data])


@router.get("/momentum/{hs_code}", response_model=SingleMomentumResponse)
def single_momentum(hs_code: str):
    if hs_code not in loader.hs_categories:
        raise HTTPException(status_code=404, detail=f"Unknown HS code: {hs_code}")
    return SingleMomentumResponse(**analytics_service.get_single_momentum(hs_code))


# ─── Currency Sensitivity ───────────────

@router.get("/sensitivity/currency", response_model=CurrencySensitivityResponse)
def currency_sensitivity(
    target_yyyymm: int = Query(..., description="Target month YYYYMM"),
    n_months: int = Query(1, ge=1, le=6),
    pkr_min: float = Query(260.0),
    pkr_max: float = Query(330.0),
    fixed_oil: float = Query(78.0),
    fixed_conf: float = Query(98.0),
):
    if pkr_min >= pkr_max:
        raise HTTPException(status_code=400, detail="pkr_min must be less than pkr_max")

    data = analytics_service.get_currency_sensitivity(
        target_yyyymm, n_months, pkr_min, pkr_max, fixed_oil, fixed_conf
    )
    return CurrencySensitivityResponse(
        target_yyyymm=target_yyyymm,
        pkr_range_min=pkr_min,
        pkr_range_max=pkr_max,
        commodities=[SensitivityItem(**d) for d in data],
    )


# ─── Model fit — actual vs one-step preds (historic macros) ───────────────

@router.get("/model-fit/{hs_code}", response_model=ModelFitResponse)
def model_fit_series(
    hs_code: str,
    start_yyyymm: int = Query(..., description="First month YYYYMM (typically first test month)"),
    end_yyyymm: int = Query(..., description="Last month YYYYMM inclusive (typically data_end)"),
):
    """Retrospective predictions from the loaded champion model (`loader.model`)."""
    if hs_code not in loader.hs_categories:
        raise HTTPException(status_code=404, detail=f"Unknown HS code: {hs_code}")
    if start_yyyymm > end_yyyymm:
        raise HTTPException(status_code=400, detail="start_yyyymm must be <= end_yyyymm")

    pts = analytics_service.model_fit_vs_actual(hs_code, start_yyyymm, end_yyyymm)
    if not pts:
        raise HTTPException(
            status_code=404,
            detail="No overlapping master rows for that range.",
        )

    end_eff = pts[-1]["month"]
    return ModelFitResponse(
        hs_code=hs_code,
        commodity=loader.HS_LABELS.get(hs_code, hs_code),
        start_yyyymm=pts[0]["month"],
        end_yyyymm=end_eff,
        points=[ModelFitPoint(**p) for p in pts],
    )


# ─── Historical ─────────────────────────

@router.get("/historical/{hs_code}", response_model=HistoricalResponse)
def historical_data(
    hs_code: str,
    months: int = Query(24, ge=1, le=186)
):
    if hs_code not in loader.hs_categories:
        raise HTTPException(status_code=404, detail=f"Unknown HS code: {hs_code}")

    data = analytics_service.get_historical(hs_code, months)
    return HistoricalResponse(
        hs_code=data["hs_code"],
        commodity=data["commodity"],
        months_requested=data["months_requested"],
        data=[HistoricalPoint(**p) for p in data["data"]],
    )
