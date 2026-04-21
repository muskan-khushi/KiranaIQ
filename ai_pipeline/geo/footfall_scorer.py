"""
Footfall Scorer
Uses OpenStreetMap Overpass API (free, no API key) to count nearby POIs
and compute a footfall proxy index 0–100.
Redis-cached for 6 hours to avoid hammering the API.
"""
import math
import json
import httpx
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Weight of each POI type for footfall — higher = more foot traffic generated
POI_WEIGHTS = {
    "school": 8,
    "college": 10,
    "office": 9,
    "bus_stop": 12,
    "station": 15,
    "market": 14,
    "hospital": 7,
    "bank": 6,
    "pharmacy": 5,
    "supermarket": 11,
    "convenience": 8,
    "restaurant": 6,
    "temple": 5,
    "mosque": 5,
    "church": 4,
}


class FootfallScorer:
    async def score(self, lat: float, lng: float, radius: int = 500) -> float:
        # Try Redis cache first
        cache_key = f"geo:footfall:{round(lat, 4)}:{round(lng, 4)}"
        redis = None
        try:
            from app.db.redis import get_redis
            redis = get_redis()
            cached = await redis.get(cache_key)
            if cached:
                return float(cached)
        except Exception:
            redis = None  # Redis unavailable — continue without cache

        raw_score = await self._query_overpass(lat, lng, radius)
        score = round(min(100.0, raw_score), 2)

        # Cache for 6 hours
        if redis is not None:
            try:
                await redis.setex(cache_key, 21600, str(score))
            except Exception:
                pass

        return score

    async def _query_overpass(self, lat: float, lng: float, radius: int) -> float:
        query = f"""
[out:json][timeout:15];
(
  node["amenity"~"school|college|hospital|bank|pharmacy|bus_stop|restaurant|place_of_worship"]
    (around:{radius},{lat},{lng});
  node["shop"~"supermarket|convenience|market|general"]
    (around:{radius},{lat},{lng});
  node["public_transport"="stop_position"]
    (around:{radius},{lat},{lng});
  way["highway"~"primary|secondary|tertiary"]
    (around:100,{lat},{lng});
);
out body;"""

        try:
            async with httpx.AsyncClient(timeout=15, headers={"User-Agent": "KiranaIQ/1.0"}) as client:
                resp = await client.post(OVERPASS_URL, data={"data": query})
                data = resp.json()
        except Exception as e:
            print(f"[footfall_scorer] Overpass API error: {e}")
            return 40.0  # neutral fallback

        score = 0.0
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            tag_str = json.dumps(tags).lower()

            for poi_type, weight in POI_WEIGHTS.items():
                if poi_type in tag_str:
                    # Distance decay: closer POIs count more
                    elem_lat = element.get("lat", lat)
                    elem_lon = element.get("lon", lng)
                    dist = self._haversine_m(lat, lng, elem_lat, elem_lon)
                    decay = max(0.1, 1 - dist / radius)
                    score += weight * decay
                    break  # count each element once

        return score

    @staticmethod
    def _haversine_m(lat1, lng1, lat2, lng2) -> float:
        R = 6371000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))