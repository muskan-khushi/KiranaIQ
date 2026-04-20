"""
Competition Mapper
Queries OSM for nearby grocery/kirana stores and returns a competition density index 0–1.
0 = no competition, 1 = saturated market.
"""
import httpx
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


class CompetitionMapper:
    async def density(self, lat: float, lng: float, radius: int = 500) -> float:
        cache_key = f"geo:competition:{round(lat,4)}:{round(lng,4)}"
        try:
            from app.db.redis import get_redis
            redis = get_redis()
            cached = await redis.get(cache_key)
            if cached:
                return float(cached)
        except Exception:
            redis = None

        index = await self._query(lat, lng, radius)

        try:
            if redis:
                await redis.setex(cache_key, 21600, str(index))
        except Exception:
            pass

        return index

    async def _query(self, lat: float, lng: float, radius: int) -> float:
        query = f"""
[out:json][timeout:10];
(
  node["shop"~"convenience|supermarket|grocery|general"]
    (around:{radius},{lat},{lng});
  node["amenity"="marketplace"]
    (around:{radius},{lat},{lng});
);
out count;"""

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(OVERPASS_URL, data={"data": query})
                data = resp.json()
                count = data.get("elements", [{}])[0].get("tags", {}).get("total", 0)
                count = int(count)
        except Exception as e:
            print(f"[competition_mapper] Overpass error: {e}")
            return 0.3  # neutral fallback

        # Sigmoid-style normalization: 0 stores=0, 5 stores≈0.7, 10+ stores≈1.0
        index = round(min(1.0, count / 10.0), 3)
        return index