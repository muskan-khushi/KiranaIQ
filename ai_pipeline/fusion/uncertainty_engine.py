"""
Uncertainty Engine
Computes confidence score and range widths from signal quality — never a guess.
Base spread: 25%, reduced by strong signals, widened by fraud flags.
"""


class UncertaintyEngine:
    BASE_SPREAD = 0.25

    SIGNAL_REDUCTIONS = {
        "sdi_strong":       (-0.05, lambda s: s.get("shelf_density_index", 0) > 0.7),
        "geo_strong":       (-0.04, lambda s: s.get("geo_footfall_score", 0) > 60),
        "shop_size_known":  (-0.06, lambda s: bool(s.get("shop_size_sqft"))),
        "years_known":      (-0.03, lambda s: bool(s.get("years_in_operation"))),
        "multi_image":      (-0.03, lambda s: s.get("n_images_used", 1) >= 3),
        "high_consistency": (-0.04, lambda s: s.get("consistency_score", 0) > 0.8),
    }

    FRAUD_PENALTY_PER_FLAG = 0.05

    def compute_ranges(self, point: dict, signals: dict, fraud: dict) -> dict:
        spread = self.BASE_SPREAD

        # Apply signal quality reductions
        for _, (delta, condition) in self.SIGNAL_REDUCTIONS.items():
            if condition(signals):
                spread += delta

        # Widen for fraud flags
        n_flags = len(fraud.get("flags", []))
        fraud_penalty = n_flags * self.FRAUD_PENALTY_PER_FLAG
        spread += fraud_penalty

        # Clamp spread to 15%–50%
        spread = round(max(0.15, min(0.50, spread)), 4)

        d = point["daily_sales"]
        m = point["monthly_revenue"]
        i = point["monthly_income"]

        confidence = round(max(0.20, 1.0 - spread - fraud_penalty * 0.5), 2)

        return {
            "daily_sales_range":    (int(d * (1 - spread)), int(d * (1 + spread))),
            "monthly_revenue_range":(int(m * (1 - spread)), int(m * (1 + spread))),
            "monthly_income_range": (int(i * (1 - spread)), int(i * (1 + spread))),
            "confidence_score":     confidence,
            "spread_used":          spread,
        }