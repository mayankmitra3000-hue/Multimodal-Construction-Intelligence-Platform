from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:  # pragma: no cover - dotenv is optional during import
    pass

AiMode = Literal["auto", "gemini", "mock"]


def _split_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseModel):
    app_name: str = "AI-Powered Multimodal Construction Intelligence Platform"
    version: str = "0.1.0"
    ai_mode: AiMode = "auto"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    max_upload_bytes: int = 8 * 1024 * 1024

    @property
    def provider_configured(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def effective_mode(self) -> Literal["gemini", "mock"]:
        if self.ai_mode == "mock":
            return "mock"
        if self.ai_mode == "gemini":
            return "gemini"
        return "gemini" if self.gemini_api_key else "mock"

    @classmethod
    def from_env(cls) -> "Settings":
        raw_mode = os.getenv("AI_MODE", "auto").strip().lower()
        if raw_mode not in {"auto", "gemini", "mock"}:
            raw_mode = "auto"
        return cls(
            ai_mode=raw_mode,  # type: ignore[arg-type]
            gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
            gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            cors_origins=_split_csv(
                os.getenv("CORS_ORIGINS"),
                ["http://localhost:5173", "http://127.0.0.1:5173"],
            ),
            max_upload_bytes=int(os.getenv("MAX_UPLOAD_BYTES", str(8 * 1024 * 1024))),
        )


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()
