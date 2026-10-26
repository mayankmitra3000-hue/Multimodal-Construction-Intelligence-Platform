from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .ai.base import AIProviderError
from .config import get_settings
from .dependencies import build_ai_service
from .routers import cracks, daily, knowledge, meta, planning, safety, valuation, weather

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("construction-intelligence")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.ai_service = build_ai_service()
    logger.info(
        "AI mode=%s effective=%s model=%s",
        settings.ai_mode,
        app.state.ai_service.mode,
        app.state.ai_service.model_name,
    )
    if settings.ai_mode == "gemini" and not settings.provider_configured:
        logger.warning("AI_MODE=gemini but GEMINI_API_KEY is missing; requests will fail.")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=(
            "Multimodal decision support for construction safety, defects, valuation, "
            "planning, daily reporting, weather risk, and knowledge assistance. "
            "Every endpoint returns a strict, schema-validated JSON contract."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AIProviderError)
    async def ai_error_handler(_: Request, exc: AIProviderError) -> JSONResponse:
        return JSONResponse(
            status_code=502,
            content={"detail": str(exc), "code": "ai_provider_error"},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {}
        location = ".".join(str(part) for part in first.get("loc", []) if part != "body")
        message = first.get("msg", "Request validation failed.")
        detail = f"{location}: {message}" if location else message
        return JSONResponse(
            status_code=422,
            content={
                "detail": detail,
                "code": "validation_error",
                "errors": exc.errors(),
            },
        )

    for router in (
        meta.router,
        safety.router,
        cracks.router,
        valuation.router,
        planning.router,
        daily.router,
        weather.router,
        knowledge.router,
    ):
        app.include_router(router, prefix="/api")

    @app.get("/", tags=["Platform"])
    def root() -> dict:
        return {
            "name": settings.app_name,
            "version": settings.version,
            "docs": "/docs",
            "health": "/api/health",
            "features": "/api/features",
        }

    return app


app = create_app()
