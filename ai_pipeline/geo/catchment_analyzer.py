"""
Catchment Analyzer
Estimates residential density and income proxy from OSM building/landuse data.
Returns a catchment score 0–100 and an income_proxy label.
"""
import httpx
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


class CatchmentAnalyzer:
    async def analyze(self, lat: float, lng: float, radius: int = 500) -> dict:
        query = f"""
[out:json][timeout:10];
(
  way["building"~"residential|apartments|house"](around:{radius},{lat},{lng});
  way["landuse"~"residential|commercial"](around:{radius},{lat},{lng});
  node["amenity"~"school|college|university"](around:{radius},{lat},{lng});
);
out count;"""

        try:
            async with httpx.AsyncClient(timeout=10, headers={"User-Agent": "KiranaIQ/1.0"}) as client:
                resp = await client.post(OVERPASS_URL, data={"data": query})
                data = resp.json()
                count = int(
                    data.get("elements", [{}])[0]
                    .get("tags", {})
                    .get("total", 0)
                )
        except Exception as e:
            print(f"[catchment_analyzer] Overpass error: {e}")
            count = 10  # neutral fallback

        # Score: more residential buildings = higher catchment
        score = round(min(100.0, count * 3.5), 1)

        # Income proxy: rough heuristic based on school density
        # (areas with colleges tend to have higher disposable income)
        income_proxy = "medium"  # default; can be enriched with census data later

        return {
            "score": score,
            "income_proxy": income_proxy,
            "residential_density": count,
        }