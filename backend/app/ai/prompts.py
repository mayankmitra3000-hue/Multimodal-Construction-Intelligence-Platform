from __future__ import annotations

import json
from typing import Any

from ..schemas.daily import DailyRequest
from ..schemas.planning import PlanningRequest
from ..schemas.valuation import ValuationRequest
from ..schemas.weather import WeatherRequest

SAFETY_SYSTEM = (
    "You are a construction site safety auditor performing a visual inspection. "
    "Identify visible hazards, PPE usage, housekeeping, access/egress, electrical, "
    "lifting, excavation, and public-protection issues. Only report what is visible or "
    "strongly supported by the notes. For every hazard give evidence and a concrete "
    "corrective action. Score compliance conservatively."
)

CRACK_SYSTEM = (
    "You are a structural forensics engineer reviewing a photo of concrete or masonry. "
    "Determine whether a crack is present and classify its likely mechanism. Estimate "
    "dimensions only when a scale reference is visible; otherwise return null for that "
    "dimension and say so in the assessment. Distinguish cosmetic from structurally "
    "significant cracking. Recommend monitoring or repair with clear urgency."
)

VALUATION_SYSTEM = (
    "You are a chartered quantity surveyor and valuer. Produce a defensible market value "
    "range using the supplied attributes, location context, condition, age, and amenities. "
    "Give a price per square metre range in the requested currency and explain the main "
    "value drivers with signed weights that sum to approximately 1.0. Be transparent about "
    "assumptions and avoid false precision."
)

PLANNING_SYSTEM = (
    "You are a construction project planner. Build a realistic, logically sequenced plan "
    "with phases, tasks, dependencies, milestones, a critical path, resource loading, and "
    "a percentage budget breakdown. Durations must be internally consistent with phase "
    "day ranges. Prefer conventional trades and standard sequencing. Surface the top risks "
    "with mitigations."
)

DAILY_SYSTEM = (
    "You are a site manager's daily-report assistant. Turn raw site notes into a crisp "
    "executive summary, verified key updates, issues with severity, owned action items, "
    "workforce summary, materials/equipment notes, safety observations, and tomorrow's "
    "focus. Do not invent facts that are not in the notes. Infer sensible owners (e.g. "
    "Site Engineer, Safety Officer, Foreman) and prioritize."
)

WEATHER_SYSTEM = (
    "You are a construction weather-risk advisor. Produce a short AI-estimated outlook "
    "(this is not a live meteorological feed), then rate specific site activities for "
    "suitability. Account for rain, wind, temperature extremes, and curing/coating needs. "
    "State clearly that the outlook is estimated and should be checked against an official "
    "forecast before high-risk work."
)

KNOWLEDGE_SYSTEM = (
    "You are a construction knowledge assistant. Answer practical questions using sound "
    "engineering and site-management reasoning. Reference widely recognized standards or "
    "codes generically when relevant, but warn that local codes govern. If an image is "
    "provided, describe what it shows and connect it to the question. Always include a "
    "short professional disclaimer."
)


def _payload(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return json.dumps(value, indent=2, default=str)


def safety_prompt(notes: str | None) -> str:
    return (
        "Inspect the attached construction site image for safety and PPE compliance.\n"
        f"Supervisor notes: {notes or 'None supplied.'}\n"
        "Return a structured audit. Use evidence grounded in the image. Include PPE items "
        "for helmet, high-visibility vest, safety harness, eye protection, gloves, and "
        "safety footwear. If a person is not visible, mark PPE status unclear."
    )


def crack_prompt(notes: str | None) -> str:
    return (
        "Inspect the attached image for cracks and structural distress.\n"
        f"Inspector notes: {notes or 'None supplied.'}\n"
        "Return a structured assessment. If no crack is visible, set crack_detected=false, "
        "severity=low, severity_score=0, empty repair options, and a 0-0 cost range."
    )


def valuation_prompt(request: ValuationRequest) -> str:
    return (
        "Estimate the market value of the following property. Use the requested currency "
        f"({request.currency}) for all monetary fields.\nInput:\n{_payload(request)}"
    )


def planning_prompt(request: PlanningRequest) -> str:
    return (
        "Create a construction plan for the following project brief. Respect the stated "
        "constraints, target duration, and team size when supplied. Task IDs must be unique "
        "and dependency IDs must refer to existing tasks. Budget percentages should total "
        "100 (or omit amount when budget is unknown).\n"
        f"Input:\n{_payload(request)}"
    )


def daily_prompt(request: DailyRequest) -> str:
    return (
        "Summarize the following site notes into a structured daily report. Extract only "
        "facts present in the notes; mark uncertainty explicitly.\n"
        f"Input:\n{_payload(request)}"
    )


def weather_prompt(request: WeatherRequest) -> str:
    return (
        "Produce a construction weather advisory for the location and window below. "
        "Outlook length must equal the requested number of days. Rate every requested "
        "activity; if none were supplied, rate earthworks, concrete placement, steel "
        "erection, painting, and roofing. Include a data_note stating the forecast is "
        "AI-estimated, not live.\n"
        f"Input:\n{_payload(request)}"
    )


def knowledge_prompt(
    question: str, discipline: str, has_image: bool
) -> str:
    image_note = (
        "An image is attached. Analyze it and relate observations to the question."
        if has_image
        else "No image is attached."
    )
    return (
        "Answer the following construction question.\n"
        f"Discipline: {discipline}\n"
        f"Question: {question}\n"
        f"{image_note}\n"
        "Set image_analyzed=true only if an image was supplied. Include a disclaimer that "
        "the answer is guidance, not a stamped engineering opinion."
    )
