from typing import Optional
from app.db.mongo import get_db


class UserRepository:
    @property
    def col(self):
        return get_db().users

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self.col.find_one({"email": email}, {"_id": 0})

    async def find_by_id(self, user_id: str) -> Optional[dict]:
        return await self.col.find_one({"id": user_id}, {"_id": 0})

    async def create(self, data: dict) -> dict:
        await self.col.insert_one(data)
        return data