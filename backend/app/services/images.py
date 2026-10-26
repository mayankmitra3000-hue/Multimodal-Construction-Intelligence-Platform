from __future__ import annotations

from fastapi import HTTPException, UploadFile, status

from ..ai.base import ImageInput
from ..config import Settings

_MAGIC_TYPES = (
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
)

_WEBP_PREFIX = b"RIFF"
_WEBP_MARKER = b"WEBP"


def detect_image_mime(data: bytes) -> str | None:
    for magic, mime in _MAGIC_TYPES:
        if data.startswith(magic):
            return mime
    if (
        len(data) >= 12
        and data.startswith(_WEBP_PREFIX)
        and data[8:12] == _WEBP_MARKER
    ):
        return "image/webp"
    return None


async def read_image_upload(
    upload: UploadFile, settings: Settings, *, required: bool = True
) -> ImageInput | None:
    if upload is None or not upload.filename:
        if required:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="An image file is required for this feature.",
            )
        return None

    data = await upload.read()
    if not data:
        if required:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The uploaded image is empty.",
            )
        return None

    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                "Image exceeds the maximum upload size of "
                f"{settings.max_upload_bytes // (1024 * 1024)} MB."
            ),
        )

    mime_type = detect_image_mime(data)
    if mime_type is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image format. Use PNG, JPEG, or WebP.",
        )

    return ImageInput(data=data, mime_type=mime_type, filename=upload.filename)


# A valid 1x1 transparent PNG, handy for tests and demos.
SAMPLE_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)
