import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from app.utils.security import get_current_user
from app.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/avi", "video/x-msvideo"}
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES
MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


def _save_file(upload: UploadFile, request_base: str) -> str:
    """Save an uploaded file and return its public URL."""
    content_type = upload.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            400,
            f"Unsupported file type: {content_type}. "
            "Allowed: JPEG, PNG, WebP, MP4, MOV, AVI.",
        )

    sub = "videos" if content_type in ALLOWED_VIDEO_TYPES else "images"
    dest_dir = Path(settings.UPLOAD_DIR) / sub
    dest_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(upload.filename or "file").suffix or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = dest_dir / filename

    content = upload.file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(400, f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB.")

    dest.write_bytes(content)
    return f"{request_base}/uploads/{sub}/{filename}"


@router.post("/image")
def upload_image(
    image: UploadFile = File(...),
    request=None,
    user=Depends(get_current_user),
):
    from fastapi import Request
    # We need Request to build URL — inject via dependency below
    raise HTTPException(500, "Use /upload/images endpoint.")


@router.post("/images")
async def upload_images(
    images: list[UploadFile] = File(...),
    user=Depends(get_current_user),
):
    """Upload up to 10 images/videos at once. Returns list of URLs."""
    if not images:
        raise HTTPException(400, "No files uploaded.")
    if len(images) > 10:
        raise HTTPException(400, "Max 10 files at a time.")

    # We'll use relative paths since we don't have Request here
    urls = []
    for upload in images:
        content_type = upload.content_type or ""
        if content_type not in ALLOWED_TYPES:
            raise HTTPException(400, f"Unsupported file type: {content_type}")

        sub = "videos" if content_type in ALLOWED_VIDEO_TYPES else "images"
        dest_dir = Path(settings.UPLOAD_DIR) / sub
        dest_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(upload.filename or "file").suffix or ".bin"
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = dest_dir / filename

        content = await upload.read()
        if len(content) > MAX_BYTES:
            raise HTTPException(400, f"File '{upload.filename}' exceeds {settings.MAX_FILE_SIZE_MB}MB.")

        dest.write_bytes(content)
        urls.append({"url": f"/uploads/{sub}/{filename}", "filename": filename})

    return {"urls": urls}
