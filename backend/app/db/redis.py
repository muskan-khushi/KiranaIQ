import redis.asyncio as aioredis
from app.config import settings

_redis: aioredis.Redis | None = None


async def connect_redis():
    global _redis
    _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await _redis.ping()
    print("✅ Redis connected")


async def disconnect_redis():
    if _redis:
        await _redis.aclose()
        print("Redis disconnected")


def get_redis() -> aioredis.Redis:
    if _redis is None:
        raise RuntimeError("Redis not connected. Call connect_redis() first.")
    return _redis