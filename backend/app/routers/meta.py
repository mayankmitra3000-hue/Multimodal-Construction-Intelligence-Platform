from __future__ import annotations

from fastapi import APIRouter

from ..config import get_settings

router = APIRouter(tags=["Platform"])

FEATURES = [
    {
        "id": "safety",
        "title": "Site Safety Monitor",
        "description": "Visual hazard and PPE audit with risk scoring and corrective actions.",
        "method": "POST",
        "endpoint": "/api/safety/analyze",
        "input": "multipart",
        "requires_image": True,
    },
    {
        "id": "cracks",
        "title": "Crack Detection",
        "description": "Crack classification, dimensions, severity, repair options, and cost range.",
        "method": "POST",
        "endpoint": "/api/cracks/analyze",
        "input": "multipart",
        "requires_image": True,
    },
    {
        "id": "valuation",
        "title": "Real Estate Valuation",
        "description": "Attribute-driven value range, price per square metre, and market factors.",
        "method": "POST",
        "endpoint": "/api/valuation/estimate",
        "input": "json",
        "requires_image": False,
    },
    {
        "id": "planning",
        "title": "Project Planning",
        "description": "Phased programme, milestones, critical path, resources, and risk register.",
        "method": "POST",
        "endpoint": "/api/planning/generate",
        "input": "json",
        "requires_image": False,
    },
    {
        "id": "daily",
        "title": "Daily Site Assistant",
        "description": "Site log summary with issues, owned actions, and tomorrow's focus.",
        "method": "POST",
        "endpoint": "/api/daily/summarize",
        "input": "json",
        "requires_image": False,
    },
    {
        "id": "weather",
        "title": "Weather Advisory",
        "description": "Work-window forecast and activity suitability with safety advisories.",
        "method": "POST",
        "endpoint": "/api/weather/advisory",
        "input": "json",
        "requires_image": False,
    },
    {
        "id": "knowledge",
        "title": "Knowledge Assistant",
        "description": "Construction Q&A with optional image context, codes, and disclaimers.",
        "method": "POST",
        "endpoint": "/api/knowledge/ask",
        "input": "multipart",
        "requires_image": False,
    },
]


@router.get("/health", summary="Service and provider status")
def health() -> dict:
    settings = get_settings()
    effective = settings.effective_mode
    return {
        "status": "ok",
        "version": settings.version,
        "ai": {
            "mode": settings.ai_mode,
            "effective_mode": effective,
            "provider_configured": settings.provider_configured,
            "model": settings.gemini_model if effective == "gemini" else "deterministic-mock",
        },
        "feature_count": len(FEATURES),
    }


@router.get("/features", summary="Feature catalog for UI discovery")
def features() -> dict:
    return {"count": len(FEATURES), "features": FEATURES}
