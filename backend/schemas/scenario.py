from pydantic import BaseModel, Field
from typing import Literal, Optional


# ─── Requests ───────────────────────────

class SingleVariableScenarioRequest(BaseModel):
    hs_code: str
    target_yyyymm: int
    n_months: int = Field(1, ge=1, le=12)
    variable: Literal["pkr", "oil", "conf"]
    range_min: float
    range_max: float
    steps: int = Field(10, ge=3, le=20)
    fixed_pkr: float = 285.0
    fixed_oil: float = 78.0
    fixed_conf: float = 98.0


class MultiVariableScenarioRequest(BaseModel):
    hs_code: str
    target_yyyymm: int
    n_months: int = Field(1, ge=1, le=12)
    pkr_values: list[float] = Field(min_length=2, max_length=5)
    oil_values: list[float] = Field(min_length=2, max_length=5)
    fixed_conf: float = 98.0


# ─── Response pieces ────────────────────

class ScenarioPoint(BaseModel):
    input_value: float
    predicted_m: float


# ─── Responses ──────────────────────────

class SingleVariableScenarioResponse(BaseModel):
    hs_code: str
    commodity: str
    variable: str
    points: list[ScenarioPoint]
    slope_per_unit: float
    sensitivity_label: str          # "High" | "Medium" | "Low"
    annotation: str                  # human-readable slope description


class MultiVariableScenarioResponse(BaseModel):
    hs_code: str
    commodity: str
    pkr_values: list[float]
    oil_values: list[float]
    matrix: dict                     # {pkr: {oil: predicted_m}}
    best_scenario: dict              # {pkr, oil, predicted_m}
    worst_scenario: dict
