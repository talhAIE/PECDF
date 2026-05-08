from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database import crud
from ml import loader
from schemas.scenario import (
    SingleVariableScenarioRequest, SingleVariableScenarioResponse,
    MultiVariableScenarioRequest, MultiVariableScenarioResponse,
    ScenarioPoint,
)
from services import scenario_service
from middleware.auth import get_current_user

router = APIRouter(prefix="/scenario", tags=["Scenario"])


@router.post("/single-variable", response_model=SingleVariableScenarioResponse)
def single_variable_scenario(
    req: SingleVariableScenarioRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if req.hs_code not in loader.hs_categories:
        raise HTTPException(status_code=400, detail=f"Unknown HS code: {req.hs_code}")
    if req.range_min >= req.range_max:
        raise HTTPException(status_code=400, detail="range_min must be less than range_max")

    points, slope, label, annotation = scenario_service.run_single_variable_scenario(
        req.hs_code, req.target_yyyymm, req.n_months,
        req.variable, req.range_min, req.range_max, req.steps,
        req.fixed_pkr, req.fixed_oil, req.fixed_conf
    )

    # Save to DB
    crud.save_scenario(
        db,
        user_id=current_user["user_id"],
        hs_code=req.hs_code,
        commodity_name=loader.HS_LABELS[req.hs_code],
        variable_name=req.variable,
        target_month=req.target_yyyymm,
        n_months=req.n_months,
        range_min=req.range_min,
        range_max=req.range_max,
        steps=req.steps,
        points=points,
        fixed_pkr=req.fixed_pkr,
        fixed_oil=req.fixed_oil,
        fixed_conf=req.fixed_conf,
    )

    return SingleVariableScenarioResponse(
        hs_code=req.hs_code,
        commodity=loader.HS_LABELS[req.hs_code],
        variable=req.variable,
        points=[ScenarioPoint(**p) for p in points],
        slope_per_unit=slope,
        sensitivity_label=label,
        annotation=annotation,
    )


@router.post("/multi-variable", response_model=MultiVariableScenarioResponse)
def multi_variable_scenario(
    req: MultiVariableScenarioRequest,
    current_user: dict = Depends(get_current_user)
):
    if req.hs_code not in loader.hs_categories:
        raise HTTPException(status_code=400, detail=f"Unknown HS code: {req.hs_code}")

    matrix, best, worst = scenario_service.run_multi_variable_scenario(
        req.hs_code, req.target_yyyymm, req.n_months,
        req.pkr_values, req.oil_values, req.fixed_conf
    )

    # Convert matrix keys to strings for JSON serialisation
    matrix_str = {str(pkr): {str(oil): v for oil, v in oils.items()}
                  for pkr, oils in matrix.items()}

    return MultiVariableScenarioResponse(
        hs_code=req.hs_code,
        commodity=loader.HS_LABELS[req.hs_code],
        pkr_values=req.pkr_values,
        oil_values=req.oil_values,
        matrix=matrix_str,
        best_scenario=best,
        worst_scenario=worst,
    )
