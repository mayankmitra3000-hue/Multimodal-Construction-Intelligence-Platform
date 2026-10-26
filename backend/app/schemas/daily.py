from __future__ import annotations

from datetime import date

from pydantic import Field

from .common import APIModel, Priority, ResponseMeta, Severity


class DailyRequest(APIModel):
    notes: str = Field(min_length=10, max_length=20_000)
    weather: str | None = Field(default=None, max_length=500)
    report_date: date | None = None
    priorities: list[str] = Field(default_factory=list, max_length=30)


class Issue(APIModel):
    title: str
    severity: Severity
    description: str
    suggested_action: str


class ActionItem(APIModel):
    task: str
    owner: str | None = None
    due: str | None = None
    priority: Priority


class DailyResponse(APIModel):
    executive_summary: str
    key_updates: list[str]
    issues: list[Issue]
    action_items: list[ActionItem]
    workforce_summary: str
    materials_and_equipment: list[str]
    safety_observations: list[str]
    tomorrow_focus: list[str]
    meta: ResponseMeta
