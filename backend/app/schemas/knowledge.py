from __future__ import annotations

from typing import Literal

from pydantic import Field

from .common import APIModel, Confidence, ResponseMeta

Discipline = Literal[
    "general",
    "structural",
    "safety",
    "mep",
    "architecture",
    "estimating",
    "scheduling",
]


class KnowledgeRequest(APIModel):
    question: str = Field(min_length=5, max_length=4000)
    discipline: Discipline = "general"


class KnowledgeResponse(APIModel):
    answer: str
    key_points: list[str]
    applicable_codes: list[str]
    safety_notes: list[str]
    related_topics: list[str]
    image_analyzed: bool
    confidence: Confidence
    disclaimer: str
    meta: ResponseMeta
