from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database import crud
from ml import loader
from schemas.forecast import (
    MultiHorizonForecastRequest, MultiHorizonForecastResponse,
    SingleForecastRequest, SingleForecastResponse,
    AllCommoditiesForecastRequest, AllCommoditiesForecastResponse,
    PortfolioForecastRequest, PortfolioForecastResponse,
    ForecastPoint, CommodityForecastItem,
)
from schemas.common import MacroInputs
from services import forecast_service
from middleware.auth import get_current_user

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.post("/single", response_model=SingleForecastResponse)
def single_forecast(
    req: SingleForecastRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if req.hs_code not in loader.hs_categories:
        raise HTTPException(status_code=400, detail=f"Unknown HS code: {req.hs_code}")

    pred = forecast_service.make_prediction(
        req.hs_code, req.target_yyyymm,
        req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
    )
    commodity_mape = loader.get_commodity_mape(req.hs_code)
    base = commodity_mape / 100

    return SingleForecastResponse(
        hs_code=req.hs_code,
        commodity=loader.HS_LABELS[req.hs_code],
        month=req.target_yyyymm,
        predicted_m=round(pred / 1e6, 3),
        lower_bound=round(max(0.0, pred * (1 - base)) / 1e6, 3),
        upper_bound=round(pred * (1 + base) / 1e6, 3),
        macro=req.macro,
    )


@router.post("/multi-horizon", response_model=MultiHorizonForecastResponse)
def multi_horizon_forecast(
    req: MultiHorizonForecastRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if req.hs_code not in loader.hs_categories:
        raise HTTPException(status_code=400, detail=f"Unknown HS code: {req.hs_code}")

    # Check cache — same inputs already computed?
    cached = crud.get_cached_forecast(
        db, req.hs_code, req.start_yyyymm, req.n_months,
        req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
    )
    if cached and cached.results:
        points = [
            ForecastPoint(
                month=r.month,
                predicted_m=round(r.predicted_usd / 1e6, 3),
                lower_bound=r.lower_bound,
                upper_bound=r.upper_bound,
                step=r.step_number
            )
            for r in sorted(cached.results, key=lambda x: x.step_number)
        ]
        return MultiHorizonForecastResponse(
            hs_code=req.hs_code,
            commodity=loader.HS_LABELS[req.hs_code],
            n_months=req.n_months,
            macro=req.macro,
            forecast=points,
            total_predicted_m=round(sum(p.predicted_m for p in points), 3),
        )

    # Compute fresh forecast
    points_raw = forecast_service.forecast_n_months(
        req.hs_code, req.start_yyyymm, req.n_months,
        req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
    )

    # Save to DB
    crud.save_forecast(
        db,
        user_id=current_user["user_id"],
        hs_code=req.hs_code,
        commodity_name=loader.HS_LABELS[req.hs_code],
        start_month=req.start_yyyymm,
        n_months=req.n_months,
        usd_pkr=req.macro.usd_pkr,
        brent_oil=req.macro.brent_oil,
        us_confidence=req.macro.us_confidence,
        points=points_raw,
    )

    points = [ForecastPoint(**p) for p in points_raw]
    return MultiHorizonForecastResponse(
        hs_code=req.hs_code,
        commodity=loader.HS_LABELS[req.hs_code],
        n_months=req.n_months,
        macro=req.macro,
        forecast=points,
        total_predicted_m=round(sum(p.predicted_m for p in points), 3),
    )


@router.post("/all-commodities", response_model=AllCommoditiesForecastResponse)
def all_commodities_forecast(
    req: AllCommoditiesForecastRequest,
    current_user: dict = Depends(get_current_user)
):
    results = forecast_service.forecast_all_commodities(
        req.target_yyyymm,
        req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
    )
    commodities = [CommodityForecastItem(**r) for r in results]
    return AllCommoditiesForecastResponse(
        month=req.target_yyyymm,
        macro=req.macro,
        commodities=commodities,
        total_m=round(sum(c.predicted_m for c in commodities), 3),
    )


@router.post("/portfolio", response_model=PortfolioForecastResponse)
def portfolio_forecast(
    req: PortfolioForecastRequest,
    current_user: dict = Depends(get_current_user)
):
    results = forecast_service.forecast_all_commodities(
        req.target_yyyymm,
        req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
    )
    total = sum(r["predicted_m"] for r in results)
    for r in results:
        r["share_pct"] = round(r["predicted_m"] / total * 100, 1) if total > 0 else 0.0

    commodities = [CommodityForecastItem(**r) for r in results]
    return PortfolioForecastResponse(
        month=req.target_yyyymm,
        macro=req.macro,
        total_predicted_m=round(total, 3),
        commodities=commodities,
        top_commodity=commodities[0].commodity,
        concentration_risk=commodities[0].share_pct > 40 if commodities else False,
    )
