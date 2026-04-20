from datetime import datetime, timezone
from typing import Optional
from app.db.mongo import get_db


class AssessmentRepository:
    @property
    def col(self):
        return get_db().assessments

    async def create(self, data: dict) -> dict:
        data["created_at"] = datetime.now(timezone.utc)
        data["pipeline_stages"] = [
            {"stage": s, "status": "pending", "completed_at": None}
            for s in ["vision", "geo", "fraud", "fusion", "loan"]
        ]
        await self.col.insert_one(data)
        return data

    async def find_by_id(self, assessment_id: str) -> Optional[dict]:
        doc = await self.col.find_one(
            {"assessment_id": assessment_id}, {"_id": 0}
        )
        return doc

    async def update(self, assessment_id: str, data: dict) -> None:
        await self.col.update_one(
            {"assessment_id": assessment_id},
            {"$set": data},
        )

    async def update_stage(self, assessment_id: str, stage: str, status: str) -> None:
        await self.col.update_one(
            {
                "assessment_id": assessment_id,
                "pipeline_stages.stage": stage,
            },
            {
                "$set": {
                    "pipeline_stages.$.status": status,
                    "pipeline_stages.$.completed_at": (
                        datetime.now(timezone.utc) if status == "done" else None
                    ),
                }
            },
        )

    async def list_by_officer(
        self, officer_id: str, page: int = 1, limit: int = 20
    ) -> list:
        skip = (page - 1) * limit
        cursor = (
            self.col.find({"officer_id": officer_id}, {"_id": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def find_nearby_completed(
        self, lat: float, lng: float, radius_m: int = 2000, limit: int = 10
    ) -> list:
        """Geo query for peer benchmarking — requires 2dsphere index."""
        cursor = self.col.find(
            {
                "status": "completed",
                "location": {
                    "$near": {
                        "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                        "$maxDistance": radius_m,
                    }
                },
            },
            {"_id": 0, "shelf_density_index": 1, "geo_footfall_score": 1,
             "monthly_revenue_range": 1, "assessment_id": 1},
        ).limit(limit)
        return await cursor.to_list(length=limit)