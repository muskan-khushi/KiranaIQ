from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

_client: AsyncIOMotorClient | None = None
_db = None


async def connect_mongo():
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client.get_default_database()

    # Ensure required indexes
    await _db.assessments.create_index([("location", "2dsphere")])
    await _db.assessments.create_index([("officer_id", 1), ("created_at", -1)])
    await _db.assessments.create_index("assessment_id", unique=True)
    await _db.assessments.create_index("status")
    print("✅ MongoDB connected and indexes ensured")


async def disconnect_mongo():
    if _client:
        _client.close()
        print("MongoDB disconnected")


def get_db():
    if _db is None:
        raise RuntimeError("MongoDB not connected. Call connect_mongo() first.")
    return _db