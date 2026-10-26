from __future__ import annotations

from datetime import date

from pydantic import Field

from .common import APIModel, ResponseMeta, Suitability


class WeatherRequest(APIModel):
    location: str = Field(min_length=2, max_length=200)
    start_date: date | None = None
    days: int = Field(default=5, ge=1, le=7)
    trade: str | None = Field(default=None, max_length=100)
    activities: list[str] = Field(default_factory=list, max_length=20)


class DayForecast(APIModel):
    date: date
    condition: str
    temp_min_c: float
    temp_max_c: float
    precipitation_chance: int = Field(ge=0, le=100)
    wind_kph: float = Field(ge=0)


class ActivitySuitability(APIModel):
    activity: str
    suitability: Suitability
    reason: str
    best_window: str


class WeatherResponse(APIModel):
    location: str
    outlook: list[DayForecast]
    suitability: list[ActivitySuitability]
    advisories: list[str]
    safety_notes: list[str]
    schedule_impact: str
    data_note: str
    meta: ResponseMeta
