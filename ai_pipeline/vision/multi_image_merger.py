"""
Multi-Image Merger
Aggregates vision results across 3–5 store images.
Key output: consistency_score — low value triggers the fraud tripwire.
"""
import statistics
from ai_pipeline.vision.product_detector import ProductDetector


class MultiImageMerger:
    def __init__(self):
        self.detector = ProductDetector()

    def merge(self, vision_results: list[dict]) -> dict:
        if not vision_results:
            return self._empty()

        # Filter out unusable images
        usable = [r for r in vision_results if r.get("image_quality") != "unusable"]
        if not usable:
            usable = vision_results  # fallback: use all anyway

        # ── Aggregate core signals ────────────────────────────────────────────
        sdis = [r["sdi"] for r in usable]
        avg_sdi = statistics.mean(sdis)

        # Consistency score: 1 - coefficient of variation of SDI across images
        # High variance = selective photography fraud signal
        if len(sdis) > 1:
            cv = statistics.stdev(sdis) / (avg_sdi + 1e-9)
            consistency_score = round(max(0.0, 1.0 - cv), 3)
        else:
            consistency_score = 0.8  # single image — moderate confidence

        # Average refill signal
        avg_refill = statistics.mean(r["refill_signal"] for r in usable)

        # SKU diversity: take the max across images (best view wins)
        max_sku = max(r["sku_diversity"] for r in usable)

        # Store area: majority vote
        areas = [r["store_area"] for r in usable]
        store_area = max(set(areas), key=areas.count)

        # Combine all categories seen across images
        all_categories: set[str] = set()
        for r in usable:
            all_categories.update(r.get("dominant_categories", []))
        dominant_categories = list(all_categories)

        # Image type coverage (for fraud tripwire 3)
        image_type_coverage = {}
        for r in usable:
            itype = r.get("image_type", "other")
            image_type_coverage[itype] = image_type_coverage.get(itype, 0) + 1

        # ── Inventory value from merged signals ───────────────────────────────
        inventory = self.detector.estimate_inventory(
            dominant_categories, avg_sdi, store_area
        )

        return {
            "sdi": round(avg_sdi, 3),
            "sku_diversity": max_sku,
            "refill_signal": round(avg_refill, 3),
            "store_area": store_area,
            "dominant_categories": dominant_categories,
            "consistency_score": consistency_score,
            "image_type_coverage": image_type_coverage,
            "n_images_used": len(usable),
            "inventory_value": inventory["inventory_value"],
            "avg_daily_turnover": inventory["avg_daily_turnover"],
            "category_mix": inventory,
        }

    def _empty(self) -> dict:
        return {
            "sdi": 0.5, "sku_diversity": 5, "refill_signal": 0.5,
            "store_area": "medium", "dominant_categories": ["staples"],
            "consistency_score": 0.5, "image_type_coverage": {},
            "n_images_used": 0, "inventory_value": 30000,
            "avg_daily_turnover": 0.10,
            "category_mix": {"category_diversity_score": 0.3, "has_premium_categories": False},
        }