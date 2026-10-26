from __future__ import annotations

from typing import Literal

from pydantic import Field

from .common import APIModel, Confidence, MoneyRange, ResponseMeta, Severity, Urgency

CrackType = Literal[
    "hairline",
    "flexural",
    "shear",
    "settlement",
    "thermal",
    "corrosion",
    "shrinkage",
    "unknown",
]


class CrackDimensions(APIModel):
    length_cm: float | None = Field(default=None, ge=0)
    width_mm: float | None = Field(default=None, ge=0)
    estimated_depth_mm: float | None = Field(default=None, ge=0)


class RepairOption(APIModel):
    method: str
    description: str
    estimated_cost: MoneyRange
    lifespan_years: int | None = Field(default=None, ge=0)


class CrackResponse(APIModel):
    crack_detected: bool
    crack_type: CrackType | None = None
    severity: Severity
    severity_score: int = Field(ge=0, le=100)
    dimensions: CrackDimensions
    location: str
    probable_cause: str
    structural_assessment: str
    urgency: Urgency
    repair_options: list[RepairOption]
    estimated_repair_cost: MoneyRange
    monitoring_plan: list[str]
    recommendations: list[str]
    confidence: Confidence
    meta: ResponseMeta
