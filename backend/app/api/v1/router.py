from fastapi import APIRouter
from app.api.v1.assess import router as assess_router
from app.api.v1.auth import router as auth_router
from app.api.v1.history import router as history_router

v1_router = APIRouter()

v1_router.include_router(auth_router)
v1_router.include_router(assess_router)
v1_router.include_router(history_router)