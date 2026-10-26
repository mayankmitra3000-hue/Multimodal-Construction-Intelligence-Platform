from __future__ import annotations

from fastapi import APIRouter, File, Form, Request, UploadFile

from ..ai.base import build_system_prompt
from ..ai.prompts import SAFETY_SYSTEM, safety_prompt
from ..config import get_settings
from ..dependencies import get_ai_service
from ..schemas.safety import SafetyResponse
from ..services import mocks
from ..services.images import read_image_upload

router = APIRouter(prefix="/safety", tags=["Safety monitoring"])


@router.post(
    "/analyze",
    response_model=SafetyResponse,
    summary="Audit a site photo for hazards and PPE compliance",
)
async def analyze_safety(
    request: Request,
    image: UploadFile = File(..., description="Site photo (PNG/JPEG/WebP)."),
    notes: str | None = Form(default=None, max_length=4000),
) -> SafetyResponse:
    settings = get_settings()
    image_input = await read_image_upload(image, settings)
    ai = get_ai_service(request)
    result = await ai.analyze(
        schema=SafetyResponse,
        system_prompt=build_system_prompt(SAFETY_SYSTEM, SafetyResponse),
        user_prompt=safety_prompt(notes),
        image=image_input,
        mock_builder=lambda: mocks.safety(notes),
    )
    return result.data  # type: ignore[return-value]
