"""
Sales Estimator
Three-path estimation fused by data quality weights:
  Path A (55%) — Working Capital Cycle: Inventory Value × Daily Turnover
  Path B (30%) — Geo-Demand Model:      Footfall Score → benchmark range
  Path C (15%) — Size-Based Model:      Revenue per sq ft (only if size given)

Calibrated against BCG India Kirana Report 2022 benchmarks.
"""


class SalesEstimator:
    # India kirana benchmark: ₹5,000–₹15,000/day revenue
    GEO_DAILY_MIN = 3000
    GEO_DAILY_RANGE = 12000

    # Revenue per sq ft per day (urban: ₹100, semi-urban: ₹70)
    REV_PER_SQFT_DAY = 100

    WORKING_DAYS_MONTH = 26

    def estimate(self, signals: dict) -> dict:
        inv_value = signals.get("inventory_value_est", 50000)
        turnover = signals.get("avg_daily_turnover", 0.10)
        geo_score = signals.get("geo_footfall_score", 50)
        sdi = signals.get("shelf_density_index", 0.5)
        shop_sqft = signals.get("shop_size_sqft")
        years_op = signals.get("years_in_operation", 0)

        # ── Path A: Working Capital Cycle ─────────────────────────────────────
        daily_wc = inv_value * turnover

        # ── Path B: Geo-Demand ────────────────────────────────────────────────
        daily_geo = self.GEO_DAILY_MIN + (geo_score / 100) * self.GEO_DAILY_RANGE
        daily_geo *= 0.7 + 0.6 * sdi  # store quality multiplier

        # ── Weighted fusion ───────────────────────────────────────────────────
        if shop_sqft:
            daily_size = shop_sqft * self.REV_PER_SQFT_DAY
            daily = 0.40 * daily_wc + 0.25 * daily_geo + 0.35 * daily_size
        else:
            daily = 0.55 * daily_wc + 0.45 * daily_geo

        # ── Stability boost for established stores ────────────────────────────
        if years_op and years_op >= 3:
            daily *= 1.05

        monthly_revenue = daily * self.WORKING_DAYS_MONTH

        # ── Margin: 8–15% depending on category diversity ─────────────────────
        cat_diversity = signals.get("category_mix", {}).get("category_diversity_score", 0.5)
        margin = 0.08 + cat_diversity * 0.07
        monthly_income = monthly_revenue * margin

        return {
            "daily_sales": round(daily, 2),
            "monthly_revenue": round(monthly_revenue, 2),
            "monthly_income": round(monthly_income, 2),
            "margin_used": round(margin, 4),
            # Expose paths for explainability
            "path_a_daily": round(daily_wc, 2),
            "path_b_daily": round(daily_geo, 2),
            "path_c_daily": round(shop_sqft * self.REV_PER_SQFT_DAY, 2) if shop_sqft else None,
        }