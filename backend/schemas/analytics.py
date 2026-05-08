from pydantic import BaseModel
from typing import Optional


# ─── Seasonality ────────────────────────

class SeasonalityResponse(BaseModel):
    hs_code: str
    commodity: str
    monthly_averages: dict[str, float]   # {"1": 42.1, "2": 38.5, ..., "12": 55.2}
    peak_month: int
    trough_month: int
    peak_month_name: str
    trough_month_name: str
    seasonality_strength: float          # (max-min)/mean * 100


class AllSeasonalityResponse(BaseModel):
    commodities: list[SeasonalityResponse]


# ─── Momentum ───────────────────────────

class MomentumItem(BaseModel):
    hs_code: str
    commodity: str
    momentum_3m_pct: float
    momentum_6m_pct: float
    direction: str                       # "up" | "down" | "flat"
    last_actual_m: float
    last_month: int


class MomentumResponse(BaseModel):
    commodities: list[MomentumItem]


class SingleMomentumResponse(BaseModel):
    hs_code: str
    commodity: str
    momentum_3m_pct: float
    momentum_6m_pct: float
    direction: str
    last_actual_m: float
    last_month: int
    last_12_months: list[dict]           # [{month, export_value_m}]


# ─── Currency Sensitivity ───────────────

class SensitivityItem(BaseModel):
    hs_code: str
    commodity: str
    change_per_10pkr_m: float
    direction: str                       # "increases" | "decreases"
    sensitivity_rank: int


class CurrencySensitivityResponse(BaseModel):
    target_yyyymm: int
    pkr_range_min: float
    pkr_range_max: float
    commodities: list[SensitivityItem]


# ─── Historical ─────────────────────────

class HistoricalPoint(BaseModel):
    month: int
    export_value_m: float


class HistoricalResponse(BaseModel):
    hs_code: str
    commodity: str
    months_requested: int
    data: list[HistoricalPoint]
