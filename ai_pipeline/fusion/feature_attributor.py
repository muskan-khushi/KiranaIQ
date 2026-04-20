"""
Feature Attributor
Computes simplified linear attribution showing which signals drove the estimate.
Shown to NBFC officers as a horizontal bar chart — no black box.
"""


class FeatureAttributor:
    # Weights must sum to ~1.0 (positive = revenue-boosting, negative = suppressing)
    FEATURE_WEIGHTS = {
        "shelf_density_index":  0.28,
        "inventory_value_est":  0.22,
        "geo_footfall_score":   0.18,
        "sku_diversity_score":  0.12,
        "competition_index":   -0.10,   # more competition = lower individual share
        "catchment_score":      0.08,
        "refill_signal":        0.07,
        "category_diversity":   0.05,
    }

    def compute(self, signals: dict, point: dict) -> list:
        attributions = []

        for feature, weight in self.FEATURE_WEIGHTS.items():
            # Pull value — handle aliases and nested dicts
            if feature == "sku_diversity_score":
                raw = signals.get("sku_diversity_score", signals.get("sku_diversity", 5))
            elif feature == "category_diversity":
                raw = signals.get("category_mix", {}).get("category_diversity_score", 0.5)
            elif feature == "inventory_value_est":
                raw = signals.get("inventory_value_est", signals.get("inventory_value", 30000))
            else:
                raw = signals.get(feature, 0)

            # Normalize to 0–1
            if raw > 1:
                norm = min(1.0, float(raw) / 100)
            else:
                norm = float(raw)

            contribution = weight * norm

            attributions.append({
                "feature": feature.replace("_", " ").title(),
                "value": round(norm, 3),
                "contribution_pct": round(abs(contribution) * 100, 1),
                "direction": "positive" if weight > 0 else "negative",
            })

        # Sort by contribution magnitude descending
        return sorted(attributions, key=lambda x: -x["contribution_pct"])