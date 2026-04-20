"""
Shelf Analyzer
Wraps the Groq vision client and normalizes raw output into clean signals.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from ai_pipeline.vision.groq_client import analyze_image_url, analyze_image_bytes


class ShelfAnalyzer:
    async def analyze(self, image_url: str) -> dict:
        raw = await analyze_image_url(image_url)
        return self._normalize(raw)

    def analyze_bytes(self, image_bytes: bytes, media_type: str = "image/jpeg") -> dict:
        raw = analyze_image_bytes(image_bytes, media_type)
        return self._normalize(raw)

    def _normalize(self, raw: dict) -> dict:
        return {
            "sdi": float(raw.get("shelf_density", 0.5)),
            "sku_diversity": int(raw.get("sku_diversity", 5)),
            "dominant_categories": raw.get("dominant_categories", ["staples"]),
            "refill_signal": float(raw.get("refill_signal", 0.5)),
            "store_area": raw.get("store_area_estimate", "medium"),
            "image_type": raw.get("image_type", "other"),
            "image_quality": raw.get("image_quality", "good"),
            "observations": raw.get("observations", ""),
        }