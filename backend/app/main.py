from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging

from app.db.mongo import connect_mongo, disconnect_mongo
from app.db.redis import connect_redis, disconnect_redis
from app.api.v1.router import v1_router
from app.config import settings
from app.middleware.rate_limit import RateLimitMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_mongo()
    await connect_redis()
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)

    # Warn about missing config
    warnings = settings.validate_for_production()
    for w in warnings:
        logger.warning(f"[CONFIG] ⚠️  {w}")

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

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiting (after CORS so preflight OPTIONS bypass it) ─────────────────
app.add_middleware(RateLimitMiddleware)

# ── Static file serving for local uploads (dev only) ─────────────────────────
if settings.STORAGE_BACKEND == "local":
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    app.mount(
        "/uploads",
        StaticFiles(directory=settings.LOCAL_UPLOAD_DIR),
        name="uploads",
    )

app.include_router(v1_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health():
    from app.db.mongo import get_db
    from app.db.redis import get_redis

    db_ok = False
    redis_ok = False

    try:
        get_db()
        db_ok = True
    except Exception:
        pass

    try:
        r = get_redis()
        await r.ping()
        redis_ok = True
    except Exception:
        pass

    groq_configured = bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_..."))

    return {
        "status": "ok" if (db_ok and redis_ok) else "degraded",
        "service": "KiranaIQ API",
        "version": "1.0.0",
        "dependencies": {
            "mongodb": "ok" if db_ok else "error",
            "redis": "ok" if redis_ok else "error",
            "groq_configured": groq_configured,
            "storage_backend": settings.STORAGE_BACKEND,
        },
    }