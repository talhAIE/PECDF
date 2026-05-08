from pydantic import BaseModel, Field
from typing import Optional
from schemas.common import MacroInputs


# ─── Requests ───────────────────────────

class SingleForecastRequest(BaseModel):
    hs_code: str
    target_yyyymm: int
    macro: MacroInputs = MacroInputs()


class MultiHorizonForecastRequest(BaseModel):
    hs_code: str
    start_yyyymm: int
    n_months: int = Field(3, ge=1, le=12)
    macro: MacroInputs = MacroInputs()


class AllCommoditiesForecastRequest(BaseModel):
    target_yyyymm: int
    macro: MacroInputs = MacroInputs()


class PortfolioForecastRequest(BaseModel):
    target_yyyymm: int
    macro: MacroInputs = MacroInputs()


# ─── Response pieces ────────────────────

class ForecastPoint(BaseModel):
    month: int
    predicted_m: float
    lower_bound: float
    upper_bound: float
    step: int


class CommodityForecastItem(BaseModel):
    hs_code: str
    commodity: str
    predicted_m: float
    rank: Optional[int] = None
    share_pct: Optional[float] = None


# ─── Responses ──────────────────────────

class SingleForecastResponse(BaseModel):
    hs_code: str
    commodity: str
    month: int
    predicted_m: float
    lower_bound: float
    upper_bound: float
    macro: MacroInputs


class MultiHorizonForecastResponse(BaseModel):
    hs_code: str
    commodity: str
    n_months: int
    macro: MacroInputs
    forecast: list[ForecastPoint]
    total_predicted_m: float


class AllCommoditiesForecastResponse(BaseModel):
    month: int
    macro: MacroInputs
    commodities: list[CommodityForecastItem]
    total_m: float


class PortfolioForecastResponse(BaseModel):
    month: int
    macro: MacroInputs
    total_predicted_m: float
    commodities: list[CommodityForecastItem]
    top_commodity: str
    concentration_risk: bool
