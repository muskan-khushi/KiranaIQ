from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import List, Optional
from app.db.repositories.assessment_repo import AssessmentRepository
from app.services.storage_service import store_many, store_upload
from app.models.assessment import AssessmentResponse, StatusResponse
from app.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/assess", tags=["Assessment"])


@router.post("/", response_model=dict)
async def create_assessment(
    images: List[UploadFile] = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    store_address: Optional[str] = Form(None),
    shop_size_sqft: Optional[float] = Form(None),
    years_in_operation: Optional[int] = Form(None),
    monthly_rent: Optional[float] = Form(None),
    video: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    if not (3 <= len(images) <= 5):
        raise HTTPException(400, "Upload 3–5 images: interior, counter, exterior")

    assessment_id = str(uuid.uuid4())

    # Store images (local dev or S3)
    image_urls = await store_many(images, assessment_id)
    video_url = None
    if video:
        video_url = await store_upload(
            video, prefix=f"assessments/{assessment_id}/video"
        )

    repo = AssessmentRepository()
    await repo.create(
        {
            "assessment_id": assessment_id,
            "officer_id": current_user["id"],
            "lat": lat,
            "lng": lng,
            "store_address": store_address,
            "image_urls": image_urls,
            "video_url": video_url,
            "shop_size_sqft": shop_size_sqft,
            "years_in_operation": years_in_operation,
            "monthly_rent": monthly_rent,
            "status": "queued",
            # GeoJSON point for peer-benchmarking geo queries
            "location": {"type": "Point", "coordinates": [lng, lat]},
        }
    )

    # Enqueue Celery task
    from app.tasks.assess_task import run_assessment_pipeline
    run_assessment_pipeline.delay(assessment_id)

    return {"assessment_id": assessment_id, "status": "queued"}


@router.get("/{assessment_id}/status", response_model=StatusResponse)
async def get_status(
    assessment_id: str, current_user: dict = Depends(get_current_user)
):
    repo = AssessmentRepository()
    doc = await repo.find_by_id(assessment_id)
    if not doc:
        raise HTTPException(404, "Assessment not found")
    return {
        "assessment_id": assessment_id,
        "status": doc["status"],
        "pipeline_stages": doc.get("pipeline_stages", []),
    }


@router.get("/{assessment_id}")
async def get_assessment(
    assessment_id: str, current_user: dict = Depends(get_current_user)
):
    repo = AssessmentRepository()
    doc = await repo.find_by_id(assessment_id)
    if not doc:
        raise HTTPException(404, "Assessment not found")
    return doc