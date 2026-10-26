from __future__ import annotations

from typing import Literal

from pydantic import Field, field_validator

from .common import APIModel, Confidence, Impact, MoneyRange, ResponseMeta

PropertyType = Literal[
    "apartment", "house", "villa", "commercial", "industrial", "land"
]
Condition = Literal["excellent", "good", "fair", "poor"]


class ValuationRequest(APIModel):
    location: str = Field(min_length=2, max_length=200)
    property_type: PropertyType
    area_sqm: float = Field(gt=0, le=1_000_000)
    age_years: int = Field(ge=0, le=250)
    condition: Condition
    bedrooms: int | None = Field(default=None, ge=0, le=100)
    bathrooms: int | None = Field(default=None, ge=0, le=100)
    amenities: list[str] = Field(default_factory=list, max_length=50)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("currency")
    @classmethod
    def _upper_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("amenities")
    @classmethod
    def _clean_amenities(cls, value: list[str]) -> list[str]:
        seen: list[str] = []
        for item in value:
            cleaned = item.strip()
            if cleaned and cleaned.lower() not in {v.lower() for v in seen}:
                seen.append(cleaned)
        return seen


class ValuationFactor(APIModel):
    name: str
    impact: Impact
    weight: float = Field(ge=0, le=1)
    explanation: str


class ValuationResponse(APIModel):
    estimated_value: MoneyRange
    price_per_sqm: MoneyRange
    confidence: Confidence
    market_outlook: Literal["declining", "stable", "appreciating"]
    valuation_factors: list[ValuationFactor]
    comparable_note: str
    assumptions: list[str]
    recommendations: list[str]
    meta: ResponseMeta
