"""
Product Detector
Maps detected product categories → inventory value estimate + daily turnover rate.
These are calibrated against Indian kirana economics (BCG Kirana Report 2022).
"""

CATEGORY_PRICE_BANDS = {
    "staples":       {"avg_sku_price": 45,  "daily_turnover": 0.15},
    "snacks":        {"avg_sku_price": 25,  "daily_turnover": 0.12},
    "beverages":     {"avg_sku_price": 35,  "daily_turnover": 0.10},
    "personal_care": {"avg_sku_price": 80,  "daily_turnover": 0.06},
    "dairy":         {"avg_sku_price": 40,  "daily_turnover": 0.20},
    "tobacco":       {"avg_sku_price": 15,  "daily_turnover": 0.25},
    "cleaning":      {"avg_sku_price": 60,  "daily_turnover": 0.05},
    "frozen":        {"avg_sku_price": 120, "daily_turnover": 0.08},
    "confectionery": {"avg_sku_price": 10,  "daily_turnover": 0.18},
    "electronics":   {"avg_sku_price": 250, "daily_turnover": 0.03},
    "imported":      {"avg_sku_price": 180, "daily_turnover": 0.04},
}

_DEFAULT_BAND = {"avg_sku_price": 40, "daily_turnover": 0.10}

AREA_MULTIPLIERS = {"small": 0.7, "medium": 1.0, "large": 1.5}


class ProductDetector:
    def estimate_inventory(
        self, categories: list[str], sdi: float, store_area: str
    ) -> dict:
        if not categories:
            categories = ["staples"]

        multiplier = AREA_MULTIPLIERS.get(store_area, 1.0)
        total_inv_value = 0.0
        weighted_turnover = 0.0

        for cat in categories:
            band = CATEGORY_PRICE_BANDS.get(cat, _DEFAULT_BAND)
            # ~15 SKU slots per category, scaled by shelf density + store area
            skus_per_cat = 15 * sdi * multiplier
            total_inv_value += skus_per_cat * band["avg_sku_price"]
            weighted_turnover += band["daily_turnover"]

        avg_turnover = weighted_turnover / len(categories)

        return {
            "inventory_value": round(total_inv_value, 2),
            "avg_daily_turnover": round(avg_turnover, 4),
            "category_diversity_score": round(len(categories) / len(CATEGORY_PRICE_BANDS), 3),
            "has_premium_categories": bool(
                {"electronics", "imported", "frozen"}.intersection(set(categories))
            ),
        }