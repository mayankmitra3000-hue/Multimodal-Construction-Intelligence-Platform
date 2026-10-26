from __future__ import annotations

from .base import AIProviderError, ImageInput


class GeminiProvider:
    """Thin async wrapper around the google-genai SDK."""

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY is empty.")
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:  # pragma: no cover - depends on install
            raise AIProviderError(
                "google-genai is not installed. Run: pip install -r requirements.txt"
            ) from exc

        self._types = types
        self.model = model
        self._client = genai.Client(api_key=api_key)

    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        image: ImageInput | None,
    ) -> str:
        types = self._types
        parts: list[object] = []
        if image is not None:
            parts.append(
                types.Part.from_bytes(data=image.data, mime_type=image.mime_type)
            )
        parts.append(user_prompt)

        try:
            response = await self._client.aio.models.generate_content(
                model=self.model,
                contents=parts,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.35,
                    max_output_tokens=8192,
                ),
            )
        except Exception as exc:  # noqa: BLE001 - normalized for callers
            raise AIProviderError(f"Gemini request failed: {exc}") from exc

        text = getattr(response, "text", None)
        if not text:
            raise AIProviderError("Gemini returned an empty response.")
        return text
