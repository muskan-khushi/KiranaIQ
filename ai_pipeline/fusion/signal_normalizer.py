"""
Signal Normalizer
Brings all raw signals to a common 0–1 scale before fusion.
Having a dedicated normalizer makes it easy to calibrate individual signals
without touching the estimator or attributor.
"""

# Normalisation specs: (raw_min, raw_max) → 0–1
# Values outside range are clamped.
SIGNAL_SPECS = {
    # Vision
    "shelf_density_index":  (0.0,   1.0),     # already 0-1 from Groq
    "sku_diversity_score":  (1,     10),       # 1 cat → 0, 10 cats → 1
    "refill_signal":        (0.0,   1.0),      # already 0-1
    "consistency_score":    (0.0,   1.0),      # already 0-1

    # Derived vision
    "inventory_value_est":  (5_000, 5_00_000), # ₹5k–₹5L typical range
    "avg_daily_turnover":   (0.03,  0.25),     # 0.03 (electronics) – 0.25 (tobacco)

    # Geo
    "geo_footfall_score":   (0,     100),      # Overpass score
    "competition_index":    (0.0,   1.0),      # already 0-1
    "catchment_score":      (0,     100),      # Overpass count * 3.5

    # Optional inputs
    "shop_size_sqft":       (50,    5000),     # sqft
    "years_in_operation":   (0,     30),       # years
    "monthly_rent":         (0,     1_00_000), # ₹/month
}


class SignalNormalizer:
    def normalize(self, signals: dict) -> dict:
        """
        Returns a new dict with all recognised keys normalised to [0, 1].
        Unrecognised keys are passed through unchanged.
        """
        out = {}
        for key, value in signals.items():
            if value is None:
                out[key] = value
                continue
            if key in SIGNAL_SPECS:
                lo, hi = SIGNAL_SPECS[key]
                raw = float(value) if not isinstance(value, dict) else value
                if isinstance(raw, float):
                    out[key] = round(max(0.0, min(1.0, (raw - lo) / (hi - lo + 1e-9))), 4)
                else:
                    out[key] = value  # dict/complex — pass through
            else:
                out[key] = value
        return out

    def normalize_value(self, key: str, raw: float) -> float:
        """Normalise a single named value; returns raw unchanged if key unknown."""
        if key not in SIGNAL_SPECS:
            return float(raw)
        lo, hi = SIGNAL_SPECS[key]
        return round(max(0.0, min(1.0, (float(raw) - lo) / (hi - lo + 1e-9))), 4)