from __future__ import annotations

from fastapi import APIRouter, File, Form, Request, UploadFile

from ..ai.base import build_system_prompt
from ..ai.prompts import CRACK_SYSTEM, crack_prompt
from ..config import get_settings
from ..dependencies import get_ai_service
from ..schemas.cracks import CrackResponse
from ..services import mocks
from ..services.images import read_image_upload

router = APIRouter(prefix="/cracks", tags=["Crack analysis"])


@router.post(
    "/analyze",
    response_model=CrackResponse,
    summary="Detect and classify cracks in concrete or masonry",
)
async def analyze_crack(
    request: Request,
    image: UploadFile = File(..., description="Close-up photo of the crack."),
    notes: str | None = Form(default=None, max_length=4000),
) -> CrackResponse:
    settings = get_settings()
    image_input = await read_image_upload(image, settings)
    ai = get_ai_service(request)
    result = await ai.analyze(
        schema=CrackResponse,
        system_prompt=build_system_prompt(CRACK_SYSTEM, CrackResponse),
        user_prompt=crack_prompt(notes),
        image=image_input,
        mock_builder=lambda: mocks.cracks(notes),
    )
    return result.data  # type: ignore[return-value]
