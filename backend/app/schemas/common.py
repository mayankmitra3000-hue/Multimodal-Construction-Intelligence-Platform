from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, use_enum_values=True)


class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Impact(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class Urgency(str, Enum):
    monitor = "monitor"
    schedule = "schedule"
    urgent = "urgent"
    immediate = "immediate"


class Suitability(str, Enum):
    good = "good"
    caution = "caution"
    avoid = "avoid"


class ResponseMeta(APIModel):
    source: Literal["gemini", "mock"] = Field(
        description="Whether this payload came from Gemini or the deterministic demo engine."
    )
    model: str | None = Field(default=None, description="Model identifier used.")
    generated_at: datetime = Field(description="UTC timestamp of response generation.")
    latency_ms: int = Field(ge=0, description="Server processing time in milliseconds.")
    warnings: list[str] = Field(
        default_factory=list, description="Non-fatal warnings about the payload."
    )


class MoneyRange(APIModel):
    min: float = Field(ge=0, description="Lower bound of the estimate.")
    max: float = Field(ge=0, description="Upper bound of the estimate.")
    currency: str = Field(default="USD", min_length=3, max_length=3)


class Confidence(APIModel):
    score: float = Field(ge=0, le=1, description="Model confidence from 0 to 1.")
    rationale: str = Field(description="Short explanation of confidence.")
