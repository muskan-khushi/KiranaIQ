"""
Cross-Signal Fraud Validator
Runs 5 automated tripwires that catch the most common gaming patterns:
  1. High inventory + low footfall (borrowed stock day-of-inspection)
  2. Low multi-image consistency (selective photography)
  3. Missing required image types (hiding low-stock areas)
  4. Premium SKUs in low-income catchment (display stock not for sale)
  5. High competition + low SDI (market share under pressure)
"""

RISK_FLAG_DEFINITIONS = {
    "inventory_footfall_mismatch": {
        "code": "inventory_footfall_mismatch",
        "severity": "high",
        "description": "High inventory density detected but geo footfall score is very low — "
                       "possible borrowed stock for inspection day.",
        "recommended_action": "Conduct a physical visit to verify actual live inventory.",
    },
    "low_image_consistency": {
        "code": "low_image_consistency",
        "severity": "high",
        "description": "Significant variance in shelf density across uploaded images — "
                       "suggests selective photography hiding low-stock areas.",
        "recommended_action": "Request a fresh complete set of images from all angles.",
    },
    "insufficient_image_coverage": {
        "code": "insufficient_image_coverage",
        "severity": "medium",
        "description": "Images do not cover all required views: interior, counter, and exterior.",
        "recommended_action": "Request the missing image types before proceeding.",
    },
    "sku_geo_income_mismatch": {
        "code": "sku_geo_income_mismatch",
        "severity": "medium",
        "description": "Premium product categories detected in a low-income catchment zone — "
                       "display stock may not reflect actual sales.",
        "recommended_action": "Verify product authenticity and request recent purchase invoices.",
    },
    "high_competition_low_sdi": {
        "code": "high_competition_low_sdi",
        "severity": "low",
        "description": "Dense competitor presence nearby combined with low shelf density — "
                       "market share and margins may be under significant pressure.",
        "recommended_action": "Reduce loan sizing. Consider field visit to assess competitive dynamics.",
    },
}

REQUIRED_IMAGE_TYPES = {"interior", "counter", "exterior"}


class CrossSignalValidator:
    def validate(self, vision: dict, footfall: float, catchment: dict) -> dict:
        flags = []

        sdi = vision.get("sdi", 0.5)
        consistency = vision.get("consistency_score", 1.0)
        coverage = vision.get("image_type_coverage", {})
        categories = vision.get("dominant_categories", [])
        competition = vision.get("competition_index", 0.3)  # passed via signals

        # ── Tripwire 1: High inventory, low footfall ──────────────────────────
        if sdi > 0.75 and footfall < 30:
            flags.append(RISK_FLAG_DEFINITIONS["inventory_footfall_mismatch"])

        # ── Tripwire 2: Low multi-image consistency ───────────────────────────
        if consistency < 0.55:
            flags.append(RISK_FLAG_DEFINITIONS["low_image_consistency"])

        # ── Tripwire 3: Missing required image types ──────────────────────────
        found_types = set(coverage.keys())
        if not REQUIRED_IMAGE_TYPES.issubset(found_types):
            flags.append(RISK_FLAG_DEFINITIONS["insufficient_image_coverage"])

        # ── Tripwire 4: Premium categories in low-income zone ─────────────────
        premium_cats = {"electronics", "frozen", "imported"}
        if premium_cats.intersection(set(categories)):
            if catchment.get("income_proxy", "medium") == "low":
                flags.append(RISK_FLAG_DEFINITIONS["sku_geo_income_mismatch"])

        # ── Tripwire 5: High competition + low SDI ────────────────────────────
        if competition > 0.65 and sdi < 0.4:
            flags.append(RISK_FLAG_DEFINITIONS["high_competition_low_sdi"])

        recommendation = self._recommend(flags, sdi, footfall)

        return {"flags": flags, "recommendation": recommendation}

    @staticmethod
    def _recommend(flags: list, sdi: float, footfall: float) -> str:
        high_severity = [f for f in flags if f["severity"] == "high"]
        if len(high_severity) >= 2:
            return "reject"
        if len(high_severity) == 1:
            return "needs_verification"
        if len(flags) >= 3:
            return "needs_verification"
        return "approve"