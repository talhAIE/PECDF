from pydantic import BaseModel, Field
from typing import Optional


class MacroInputs(BaseModel):
    usd_pkr: float = Field(285.0, ge=200.0, le=500.0, description="USD/PKR exchange rate")
    brent_oil: float = Field(78.0, ge=20.0, le=200.0, description="Brent crude oil price USD/barrel")
    us_confidence: float = Field(98.0, ge=50.0, le=150.0, description="US Consumer Confidence Index")


class CommodityInfo(BaseModel):
    hs_code: str
    name: str
    test_mape: float
    description: Optional[str] = None
