"""
Storage service with two backends:
  - local: saves to ./uploads/ — no AWS needed for dev
  - s3:    uploads to S3 bucket — for production
Both return a URL string that can be stored in MongoDB.
"""
import os
import uuid
import aiofiles
from fastapi import UploadFile
from app.config import settings


async def store_upload(file: UploadFile, prefix: str = "images") -> str:
    """Store a single upload and return its accessible URL/path."""
    ext = os.path.splitext(file.filename or "file.jpg")[1] or ".jpg"
    filename = f"{prefix}/{uuid.uuid4().hex}{ext}"

    if settings.STORAGE_BACKEND == "s3":
        return await _upload_to_s3(file, filename)
    else:
        return await _save_locally(file, filename)


async def store_many(files: list[UploadFile], assessment_id: str) -> list[str]:
    urls = []
    for i, f in enumerate(files):
        url = await store_upload(f, prefix=f"assessments/{assessment_id}/images")
        urls.append(url)
    return urls


# ── Local backend ─────────────────────────────────────────────────────────────

async def _save_locally(file: UploadFile, filename: str) -> str:
    dest = os.path.join(settings.LOCAL_UPLOAD_DIR, filename)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    content = await file.read()
    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)
    await file.seek(0)
    # Return a path that the API can serve via /uploads static mount
    return f"/uploads/{filename}"


# ── S3 backend ────────────────────────────────────────────────────────────────

async def _upload_to_s3(file: UploadFile, filename: str) -> str:
    import boto3
    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    content = await file.read()
    await file.seek(0)
    s3.put_object(
        Bucket=settings.AWS_BUCKET,
        Key=filename,
        Body=content,
        ContentType=file.content_type or "image/jpeg",
    )
    return f"https://{settings.AWS_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"