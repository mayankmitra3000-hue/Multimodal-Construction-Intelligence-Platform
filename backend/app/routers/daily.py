from __future__ import annotations

from fastapi import APIRouter, Request

from ..ai.base import build_system_prompt
from ..ai.prompts import DAILY_SYSTEM, daily_prompt
from ..dependencies import get_ai_service
from ..schemas.daily import DailyRequest, DailyResponse
from ..services import mocks

router = APIRouter(prefix="/daily", tags=["Daily site assistant"])


@router.post(
    "/summarize",
    response_model=DailyResponse,
    summary="Turn raw site notes into a daily report with action items",
)
async def summarize_day(
    request: Request, payload: DailyRequest
) -> DailyResponse:
    ai = get_ai_service(request)
    result = await ai.analyze(
        schema=DailyResponse,
        system_prompt=build_system_prompt(DAILY_SYSTEM, DailyResponse),
        user_prompt=daily_prompt(payload),
        mock_builder=lambda: mocks.daily(payload),
    )
    return result.data  # type: ignore[return-value]
