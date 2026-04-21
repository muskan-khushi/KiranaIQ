import asyncio
from app.tasks.celery_app import celery
from app.db.repositories.assessment_repo import AssessmentRepository

# Module-level flag so worker process only connects once
_connections_initialized = False


async def _ensure_connections():
    global _connections_initialized
    if _connections_initialized:
        return
    from app.db.mongo import connect_mongo, _db
    from app.db.redis import connect_redis, _redis

    # Only connect if not already connected
    if _db is None:
        await connect_mongo()
    if _redis is None:
        await connect_redis()
    _connections_initialized = True


@celery.task(bind=True, max_retries=2, name="tasks.run_assessment_pipeline")
def run_assessment_pipeline(self, assessment_id: str):
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_run(assessment_id))
    except Exception as exc:
        # Mark as failed in DB, then retry
        try:
            loop2 = asyncio.new_event_loop()
            asyncio.set_event_loop(loop2)
            loop2.run_until_complete(_mark_failed(assessment_id, str(exc)))
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=30)


async def _run(assessment_id: str):
    # Need DB connections inside the worker process
    from app.db.mongo import connect_mongo, _db
    from app.db.redis import connect_redis, _redis

    if _db is None:
        await connect_mongo()
    if _redis is None:
        await connect_redis()

    repo = AssessmentRepository()
    doc = await repo.find_by_id(assessment_id)
    if not doc:
        raise ValueError(f"Assessment {assessment_id} not found")

    from ai_pipeline.pipeline import KiranaIQPipeline
    pipeline = KiranaIQPipeline()

    # Filter out None values from optional_inputs so they don't
    # poison the signals dict with null values
    raw_optional = {
        "shop_size_sqft":     doc.get("shop_size_sqft"),
        "years_in_operation": doc.get("years_in_operation"),
        "monthly_rent":       doc.get("monthly_rent"),
    }
    optional_inputs = {k: v for k, v in raw_optional.items() if v is not None}

    result = await pipeline.run(
        assessment_id=assessment_id,
        image_urls=doc["image_urls"],
        lat=doc["lat"],
        lng=doc["lng"],
        video_url=doc.get("video_url"),
        optional_inputs=optional_inputs,
    )

    await repo.update(assessment_id, {**result, "status": "completed"})


async def _mark_failed(assessment_id: str, error: str):
    try:
        from app.db.mongo import connect_mongo, _db
        if _db is None:
            await connect_mongo()
        repo = AssessmentRepository()
        await repo.update(assessment_id, {"status": "failed", "error": error})
    except Exception:
        pass