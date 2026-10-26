from __future__ import annotations

from fastapi import APIRouter, File, Form, Request, UploadFile

from ..ai.base import build_system_prompt
from ..ai.prompts import KNOWLEDGE_SYSTEM, knowledge_prompt
from ..config import get_settings
from ..dependencies import get_ai_service
from ..schemas.knowledge import Discipline, KnowledgeResponse
from ..services import mocks
from ..services.images import read_image_upload

router = APIRouter(prefix="/knowledge", tags=["Knowledge assistant"])


@router.post(
    "/ask",
    response_model=KnowledgeResponse,
    summary="Ask a construction question, optionally with an image",
)
async def ask_knowledge(
    request: Request,
    question: str = Form(..., min_length=5, max_length=4000),
    discipline: Discipline = Form(default="general"),
    image: UploadFile | None = File(default=None, description="Optional reference image."),
) -> KnowledgeResponse:
    settings = get_settings()
    image_input = await read_image_upload(image, settings, required=False)
    ai = get_ai_service(request)
    result = await ai.analyze(
        schema=KnowledgeResponse,
        system_prompt=build_system_prompt(KNOWLEDGE_SYSTEM, KnowledgeResponse),
        user_prompt=knowledge_prompt(question, discipline, image_input is not None),
        image=image_input,
        mock_builder=lambda: mocks.knowledge(
            question, discipline, image_input is not None
        ),
    )
    return result.data  # type: ignore[return-value]
