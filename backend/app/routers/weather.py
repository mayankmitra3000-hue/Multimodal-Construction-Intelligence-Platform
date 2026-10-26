from __future__ import annotations

from fastapi import APIRouter, Request

from ..ai.base import build_system_prompt
from ..ai.prompts import WEATHER_SYSTEM, weather_prompt
from ..dependencies import get_ai_service
from ..schemas.weather import WeatherRequest, WeatherResponse
from ..services import mocks

router = APIRouter(prefix="/weather", tags=["Weather advisory"])


@router.post(
    "/advisory",
    response_model=WeatherResponse,
    summary="Assess weather suitability for planned site activities",
)
async def weather_advisory(
    request: Request, payload: WeatherRequest
) -> WeatherResponse:
    ai = get_ai_service(request)
    result = await ai.analyze(
        schema=WeatherResponse,
        system_prompt=build_system_prompt(WEATHER_SYSTEM, WeatherResponse),
        user_prompt=weather_prompt(payload),
        mock_builder=lambda: mocks.weather(payload),
    )
    return result.data  # type: ignore[return-value]
