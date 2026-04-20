from fastapi import APIRouter, Depends, Query
from app.db.repositories.assessment_repo import AssessmentRepository
from app.dependencies import get_current_user

router = APIRouter(prefix="/assessments", tags=["History"])


@router.get("/")
async def list_assessments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    repo = AssessmentRepository()
    results = await repo.list_by_officer(current_user["id"], page=page, limit=limit)
    return {"page": page, "limit": limit, "results": results}