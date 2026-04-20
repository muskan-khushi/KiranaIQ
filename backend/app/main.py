from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.db.mongo import connect_mongo, disconnect_mongo
from app.db.redis import connect_redis, disconnect_redis
from app.api.v1.router import v1_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_mongo()
    await connect_redis()

    # Ensure local upload dir exists
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)

    yield

    # Shutdown
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(
    title="KiranaIQ API",
    description="Remote cash flow underwriting engine for kirana stores",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local uploads as static files (dev only)
if settings.STORAGE_BACKEND == "local":
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="uploads")

app.include_router(v1_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "KiranaIQ API"}