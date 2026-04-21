"""
Rate Limiting Middleware
Simple sliding-window rate limiter stored in Redis.
Per-IP: 120 requests / 60 seconds for general endpoints.
Per-IP: 10 requests / 60 seconds for POST /assess (expensive AI pipeline).
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
import logging

logger = logging.getLogger(__name__)

# Limits: (max_requests, window_seconds)
LIMITS = {
    "POST:/api/v1/assess/": (10, 60),
    "POST:/api/v1/assess":  (10, 60),
}
DEFAULT_LIMIT = (120, 60)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Try to get Redis; if unavailable, skip rate limiting gracefully
        try:
            from app.db.redis import get_redis
            redis = get_redis()
        except Exception:
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"
        route = f"{request.method}:{request.url.path}"

        max_req, window = LIMITS.get(route, DEFAULT_LIMIT)
        key = f"rl:{ip}:{route}"

        try:
            now = int(time.time())
            window_start = now - window

            # Sliding window using a sorted set
            pipe = redis.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, window)
            results = await pipe.execute()
            count = results[2]

            if count > max_req:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": f"Rate limit exceeded. Max {max_req} requests per {window}s.",
                        "retry_after": window,
                    },
                    headers={"Retry-After": str(window)},
                )
        except Exception as e:
            logger.warning(f"Rate limiter error (bypassing): {e}")

        return await call_next(request)