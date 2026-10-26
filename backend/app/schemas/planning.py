from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import Field, field_validator

from .common import APIModel, ResponseMeta

Probability = Literal["low", "medium", "high"]


class PlanningRequest(APIModel):
    project_name: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=10, max_length=8000)
    location: str | None = Field(default=None, max_length=200)
    budget: float | None = Field(default=None, gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    start_date: date | None = None
    duration_weeks_target: int | None = Field(default=None, ge=1, le=520)
    team_size: int | None = Field(default=None, ge=1, le=10_000)
    constraints: list[str] = Field(default_factory=list, max_length=50)

    @field_validator("currency")
    @classmethod
    def _upper_currency(cls, value: str) -> str:
        return value.upper()


class PlanTask(APIModel):
    id: str
    name: str
    duration_days: int = Field(ge=1)
    depends_on: list[str] = Field(default_factory=list)
    trade: str
    crew_size: int = Field(ge=1)


class Phase(APIModel):
    name: str
    start_day: int = Field(ge=1)
    end_day: int = Field(ge=1)
    summary: str
    tasks: list[PlanTask]


class Milestone(APIModel):
    name: str
    day: int = Field(ge=1)
    deliverable: str


class ResourcePlan(APIModel):
    role: str
    headcount: int = Field(ge=1)
    allocation_weeks: float = Field(gt=0)


class BudgetLine(APIModel):
    category: str
    percent: float = Field(ge=0, le=100)
    amount: float | None = Field(default=None, ge=0)


class ProjectRisk(APIModel):
    title: str
    probability: Probability
    impact: Probability
    mitigation: str


class PlanningResponse(APIModel):
    summary: str
    total_duration_days: int = Field(ge=1)
    phases: list[Phase]
    milestones: list[Milestone]
    critical_path: list[str]
    resource_plan: list[ResourcePlan]
    budget_breakdown: list[BudgetLine]
    risks: list[ProjectRisk]
    assumptions: list[str]
    meta: ResponseMeta
