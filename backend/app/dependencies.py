from __future__ import annotations

from fastapi import Request

from .ai.base import AIService
from .config import get_settings


def build_ai_service() -> AIService:
    return AIService(get_settings())


def get_ai_service(request: Request) -> AIService:
    service: AIService | None = getattr(request.app.state, "ai_service", None)
    if service is None:
        service = build_ai_service()
        request.app.state.ai_service = service
    return service
