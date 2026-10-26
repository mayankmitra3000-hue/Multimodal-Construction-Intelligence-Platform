from __future__ import annotations

from fastapi import APIRouter, Request

from ..ai.base import build_system_prompt
from ..ai.prompts import PLANNING_SYSTEM, planning_prompt
from ..dependencies import get_ai_service
from ..schemas.planning import PlanningRequest, PlanningResponse
from ..services import mocks

router = APIRouter(prefix="/planning", tags=["Project planning"])


@router.post(
    "/generate",
    response_model=PlanningResponse,
    summary="Generate a phased programme, milestones, and resource plan",
)
async def generate_plan(
    request: Request, payload: PlanningRequest
) -> PlanningResponse:
    ai = get_ai_service(request)
    result = await ai.analyze(
        schema=PlanningResponse,
        system_prompt=build_system_prompt(PLANNING_SYSTEM, PlanningResponse),
        user_prompt=planning_prompt(payload),
        mock_builder=lambda: mocks.planning(payload),
    )
    return result.data  # type: ignore[return-value]
