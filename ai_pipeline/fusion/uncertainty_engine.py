"""
Uncertainty Engine
Computes confidence score and range widths from signal quality — never a guess.
Base spread: 25%, reduced by strong signals, widened by fraud flags.
"""


class UncertaintyEngine:
    BASE_SPREAD = 0.25

    SIGNAL_REDUCTIONS = {
        "sdi_strong":       (-0.05, lambda s: float(s.get("shelf_density_index") or 0) > 0.7),
        "geo_strong":       (-0.04, lambda s: float(s.get("geo_footfall_score") or 0) > 60),
        "shop_size_known":  (-0.06, lambda s: bool(s.get("shop_size_sqft"))),
        "years_known":      (-0.03, lambda s: bool(s.get("years_in_operation"))),
        "multi_image":      (-0.03, lambda s: int(s.get("n_images_used") or 0) >= 3),
        "high_consistency": (-0.04, lambda s: float(s.get("consistency_score") or 0) > 0.8),
    }

    FRAUD_PENALTY_PER_FLAG = 0.05

    def compute_ranges(self, point: dict, signals: dict, fraud: dict) -> dict:
        spread = self.BASE_SPREAD

        # Apply signal quality reductions (safely handle None/missing)
        for _, (delta, condition) in self.SIGNAL_REDUCTIONS.items():
            try:
                if condition(signals):
                    spread += delta
            except (TypeError, ValueError):
                pass  # Skip malformed signal values

        # Widen for fraud flags
        n_flags = len(fraud.get("flags", []))
        fraud_penalty = n_flags * self.FRAUD_PENALTY_PER_FLAG
        spread += fraud_penalty

        # Clamp spread to 15%–50%
        spread = round(max(0.15, min(0.50, spread)), 4)

        d = float(point.get("daily_sales") or 5000)
        m = float(point.get("monthly_revenue") or 130000)
        i = float(point.get("monthly_income") or 18000)

        confidence = round(max(0.20, 1.0 - spread - fraud_penalty * 0.5), 2)

        return {
            "daily_sales_range":    (int(d * (1 - spread)), int(d * (1 + spread))),
            "monthly_revenue_range":(int(m * (1 - spread)), int(m * (1 + spread))),
            "monthly_income_range": (int(i * (1 - spread)), int(i * (1 + spread))),
            "confidence_score":     confidence,
            "spread_used":          spread,
        }