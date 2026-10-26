from __future__ import annotations

from typing import Literal

from pydantic import Field

from .common import APIModel, Confidence, ResponseMeta, Severity


class Hazard(APIModel):
    id: str = Field(description="Stable identifier such as H-01.")
    title: str
    category: str = Field(description="Hazard family, e.g. fall, PPE, electrical.")
    severity: Severity
    description: str
    location: str
    evidence: str = Field(description="What in the image or notes supports this finding.")
    recommendation: str


class PPEItem(APIModel):
    name: str
    status: Literal["detected", "not_detected", "unclear"]
    confidence: float = Field(ge=0, le=1)


class SafetyResponse(APIModel):
    overall_risk: Severity
    summary: str
    workers_detected: int = Field(ge=0)
    hazards: list[Hazard]
    ppe_items: list[PPEItem]
    compliance_score: int = Field(ge=0, le=100)
    immediate_actions: list[str]
    recommendations: list[str]
    confidence: Confidence
    meta: ResponseMeta
