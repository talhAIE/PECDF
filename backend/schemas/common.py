from pydantic import BaseModel, Field
from typing import Optional


class MacroInputs(BaseModel):
    # Wide enough for Yahoo/FRED live grabs + manual scenarios; extrapolation quality drops far from training ranges.
    usd_pkr: float = Field(285.0, ge=120.0, le=560.0, description="USD/PKR exchange rate")
    brent_oil: float = Field(78.0, ge=10.0, le=350.0, description="Brent crude oil price USD/barrel")
    us_confidence: float = Field(
        98.0,
        ge=15.0,
        le=999.0,
        description="Macro demand/sentiment driver (CSV used Conference Board-scale; allow wide range for UX — extrapolation warns in UI)",
    )


class CommodityInfo(BaseModel):
    hs_code: str
    name: str
    test_mape: float
    description: Optional[str] = None
