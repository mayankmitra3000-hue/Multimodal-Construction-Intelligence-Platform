from __future__ import annotations

from fastapi import APIRouter, Request

from ..ai.base import build_system_prompt
from ..ai.prompts import VALUATION_SYSTEM, valuation_prompt
from ..dependencies import get_ai_service
from ..schemas.valuation import ValuationRequest, ValuationResponse
from ..services import mocks

router = APIRouter(prefix="/valuation", tags=["Real estate valuation"])


@router.post(
    "/estimate",
    response_model=ValuationResponse,
    summary="Estimate a property value range from structured attributes",
)
async def estimate_value(
    request: Request, payload: ValuationRequest
) -> ValuationResponse:
    ai = get_ai_service(request)
    result = await ai.analyze(
        schema=ValuationResponse,
        system_prompt=build_system_prompt(VALUATION_SYSTEM, ValuationResponse),
        user_prompt=valuation_prompt(payload),
        mock_builder=lambda: mocks.valuation(payload),
    )
    return result.data  # type: ignore[return-value]
