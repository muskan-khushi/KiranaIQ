"""
Seed demo data — run once after docker-compose up:
  docker-compose exec backend python scripts/seed_demo.py
Creates:
  - Demo NBFC officer account  (email: demo@kiranaiq.in / password: demo1234)
  - One completed assessment with realistic mock results
"""
import asyncio
import uuid
from datetime import datetime, timezone

DEMO_EMAIL = "demo@kiranaiq.in"
DEMO_PASSWORD = "demo1234"


async def seed():
    from app.db.mongo import connect_mongo
    from app.db.mongo import get_db
    from app.services.auth_service import hash_password

    await connect_mongo()
    db = get_db()

    # ── Demo user ─────────────────────────────────────────────────────────────
    existing = await db.users.find_one({"email": DEMO_EMAIL})
    if not existing:
        user_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": user_id,
            "email": DEMO_EMAIL,
            "hashed_password": hash_password(DEMO_PASSWORD),
            "full_name": "Demo Officer",
            "is_active": True,
        })
        print(f"✅ Created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    else:
        user_id = existing["id"]
        print(f"ℹ️  Demo user already exists")

    # ── Demo assessment ───────────────────────────────────────────────────────
    assessment_id = str(uuid.uuid4())
    # Coords: Chandni Chowk, Delhi — dense kirana area
    lat, lng = 28.6562, 77.2310

    await db.assessments.insert_one({
        "assessment_id": assessment_id,
        "officer_id": user_id,
        "status": "completed",
        "created_at": datetime.now(timezone.utc),
        "completed_at": datetime.now(timezone.utc),
        "lat": lat, "lng": lng,
        "store_address": "Shop 42, Chandni Chowk Market, Delhi",
        "image_urls": [],
        "video_url": None,
        "shop_size_sqft": 180,
        "years_in_operation": 7,
        "monthly_rent": 12000,
        "location": {"type": "Point", "coordinates": [lng, lat]},
        "pipeline_stages": [
            {"stage": s, "status": "done", "completed_at": datetime.now(timezone.utc)}
            for s in ["vision", "geo", "fraud", "fusion", "loan"]
        ],
        "daily_sales_range": [7200, 10800],
        "monthly_revenue_range": [187200, 280800],
        "monthly_income_range": [26208, 39312],
        "confidence_score": 0.74,
        "recommendation": "approve",
        "shelf_density_index": 0.78,
        "sku_diversity_score": 7,
        "geo_footfall_score": 72.0,
        "competition_index": 0.4,
        "risk_flags": [],
        "feature_attribution": [
            {"feature": "Shelf Density Index", "value": 0.78, "contribution_pct": 21.8, "direction": "positive"},
            {"feature": "Inventory Value Est", "value": 0.6,  "contribution_pct": 13.2, "direction": "positive"},
            {"feature": "Geo Footfall Score",  "value": 0.72, "contribution_pct": 13.0, "direction": "positive"},
            {"feature": "Sku Diversity Score", "value": 0.78, "contribution_pct": 9.3,  "direction": "positive"},
            {"feature": "Competition Index",   "value": 0.4,  "contribution_pct": 4.0,  "direction": "negative"},
        ],
        "peer_benchmark": {"percentile": 68.0, "n_peers": 0, "avg_sdi": 0.0, "avg_footfall": 0.0},
        "loan_suggestion": {
            "min_loan": 210000, "max_loan": 315000,
            "suggested_tenure_months": 18,
            "monthly_emi_range": [13200, 19800],
            "foir_used": 0.45,
            "interest_rate_pa": 0.18,
        },
    })
    print(f"✅ Created demo assessment: {assessment_id}")
    print(f"\n🚀 Login at http://localhost:8000/docs")
    print(f"   POST /api/v1/auth/login  →  {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    asyncio.run(seed())