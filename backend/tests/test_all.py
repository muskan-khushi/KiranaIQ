"""
KiranaIQ Backend + AI Pipeline Test Suite
Run from backend/ folder:
    pytest tests/test_all.py -v -s

Tests are grouped into:
  1. Unit tests  — no network, no DB (pure logic)
  2. Integration — needs GROQ_API_KEY in .env
  3. Smoke test  — full pipeline with mocked I/O
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "ai_pipeline"))


# ══════════════════════════════════════════════════════════════════════════════
# 1. UNIT TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestProductDetector:
    def setup_method(self):
        from ai_pipeline.vision.product_detector import ProductDetector
        self.detector = ProductDetector()

    def test_basic_estimate(self):
        result = self.detector.estimate_inventory(["staples", "snacks", "beverages"], 0.7, "medium")
        assert result["inventory_value"] > 0
        assert 0 < result["avg_daily_turnover"] < 1
        assert result["category_diversity_score"] > 0

    def test_large_store_higher_inventory(self):
        small = self.detector.estimate_inventory(["staples"], 0.7, "small")
        large = self.detector.estimate_inventory(["staples"], 0.7, "large")
        assert large["inventory_value"] > small["inventory_value"]

    def test_premium_categories_detected(self):
        result = self.detector.estimate_inventory(["electronics", "frozen"], 0.5, "medium")
        assert result["has_premium_categories"] is True

    def test_empty_categories_fallback(self):
        result = self.detector.estimate_inventory([], 0.5, "medium")
        assert result["inventory_value"] > 0


class TestSalesEstimator:
    def setup_method(self):
        from ai_pipeline.fusion.sales_estimator import SalesEstimator
        self.estimator = SalesEstimator()

    def _base(self, **kw):
        b = {"inventory_value_est": 80000, "avg_daily_turnover": 0.12,
             "geo_footfall_score": 65, "shelf_density_index": 0.75,
             "category_mix": {"category_diversity_score": 0.5}}
        b.update(kw)
        return b

    def test_output_shape(self):
        r = self.estimator.estimate(self._base())
        for k in ("daily_sales", "monthly_revenue", "monthly_income", "margin_used"):
            assert k in r

    def test_daily_sales_in_india_range(self):
        r = self.estimator.estimate(self._base())
        assert 1000 < r["daily_sales"] < 50000

    def test_size_boosts_estimate(self):
        without = self.estimator.estimate(self._base())
        with_sz = self.estimator.estimate(self._base(shop_size_sqft=200))
        assert without["daily_sales"] != with_sz["daily_sales"]

    def test_established_store_boost(self):
        new  = self.estimator.estimate(self._base(years_in_operation=1))
        old  = self.estimator.estimate(self._base(years_in_operation=5))
        assert old["daily_sales"] > new["daily_sales"]

    def test_margin_within_range(self):
        r = self.estimator.estimate(self._base())
        assert 0.08 <= r["margin_used"] <= 0.15


class TestUncertaintyEngine:
    def setup_method(self):
        from ai_pipeline.fusion.uncertainty_engine import UncertaintyEngine
        self.engine = UncertaintyEngine()

    def _pt(self):
        return {"daily_sales": 8000, "monthly_revenue": 208000, "monthly_income": 29120}

    def test_output_shape(self):
        r = self.engine.compute_ranges(self._pt(), {}, {"flags": []})
        assert "daily_sales_range" in r and "confidence_score" in r

    def test_range_brackets_point(self):
        r = self.engine.compute_ranges(self._pt(), {}, {"flags": []})
        lo, hi = r["daily_sales_range"]
        assert lo < 8000 < hi

    def test_flags_lower_confidence(self):
        clean = self.engine.compute_ranges(self._pt(), {}, {"flags": []})
        flagged = self.engine.compute_ranges(
            self._pt(), {}, {"flags": [{"severity": "high"}, {"severity": "medium"}]}
        )
        assert flagged["confidence_score"] < clean["confidence_score"]
        assert flagged["spread_used"] > clean["spread_used"]

    def test_strong_signals_tighten(self):
        weak = self.engine.compute_ranges(self._pt(), {}, {"flags": []})
        strong = self.engine.compute_ranges(
            self._pt(),
            {"shelf_density_index": 0.85, "geo_footfall_score": 75,
             "shop_size_sqft": 150, "years_in_operation": 5,
             "n_images_used": 4, "consistency_score": 0.9},
            {"flags": []},
        )
        assert strong["spread_used"] < weak["spread_used"]

    def test_confidence_in_range(self):
        r = self.engine.compute_ranges(self._pt(), {}, {"flags": []})
        assert 0 <= r["confidence_score"] <= 1


class TestFraudValidator:
    def setup_method(self):
        from ai_pipeline.fraud.cross_signal_validator import CrossSignalValidator
        self.v = CrossSignalValidator()

    def _clean(self):
        return {
            "sdi": 0.6, "sku_diversity": 6, "consistency_score": 0.85,
            "image_type_coverage": {"interior": 2, "counter": 1, "exterior": 1},
            "dominant_categories": ["staples", "snacks"], "competition_index": 0.3,
        }

    def test_clean_no_flags(self):
        r = self.v.validate(self._clean(), 65.0, {"score": 60, "income_proxy": "medium"})
        assert r["flags"] == [] and r["recommendation"] == "approve"

    def test_tripwire1_inv_footfall(self):
        v = {**self._clean(), "sdi": 0.9}
        r = self.v.validate(v, 20.0, {"score": 30, "income_proxy": "medium"})
        assert "inventory_footfall_mismatch" in [f["code"] for f in r["flags"]]

    def test_tripwire2_consistency(self):
        v = {**self._clean(), "consistency_score": 0.3}
        r = self.v.validate(v, 60.0, {"score": 50, "income_proxy": "medium"})
        assert "low_image_consistency" in [f["code"] for f in r["flags"]]

    def test_tripwire3_missing_images(self):
        v = {**self._clean(), "image_type_coverage": {"interior": 2}}
        r = self.v.validate(v, 60.0, {"score": 50, "income_proxy": "medium"})
        assert "insufficient_image_coverage" in [f["code"] for f in r["flags"]]

    def test_two_high_flags_reject(self):
        v = {**self._clean(), "sdi": 0.95, "consistency_score": 0.2}
        r = self.v.validate(v, 15.0, {"score": 20, "income_proxy": "medium"})
        assert r["recommendation"] == "reject"

    def test_premium_low_income(self):
        v = {**self._clean(), "dominant_categories": ["electronics", "imported"]}
        r = self.v.validate(v, 60.0, {"score": 50, "income_proxy": "low"})
        assert "sku_geo_income_mismatch" in [f["code"] for f in r["flags"]]


class TestLoanSizer:
    def setup_method(self):
        from ai_pipeline.loan.loan_sizer import LoanSizer
        self.sizer = LoanSizer()

    def test_output_shape(self):
        r = self.sizer.size((25000, 40000))
        assert "min_loan" in r and "max_loan" in r and "monthly_emi_range" in r
        assert r["foir_used"] == 0.45

    def test_loan_positive_ordered(self):
        r = self.sizer.size((20000, 35000))
        assert r["min_loan"] > 0 and r["max_loan"] > r["min_loan"]

    def test_loan_rounded_5000(self):
        r = self.sizer.size((28000, 42000))
        assert r["min_loan"] % 5000 == 0 and r["max_loan"] % 5000 == 0

    def test_emi_bounds(self):
        """
        emi_range[0] ≤ income_low  × FOIR × 1.1
        emi_range[1] ≤ income_high × FOIR × 1.1
        """
        income_low, income_high = 30000, 45000
        r = self.sizer.size((income_low, income_high))
        foir = r["foir_used"]
        assert r["monthly_emi_range"][0] <= income_low  * foir * 1.1
        assert r["monthly_emi_range"][1] <= income_high * foir * 1.1


class TestFeatureAttributor:
    def setup_method(self):
        from ai_pipeline.fusion.feature_attributor import FeatureAttributor
        self.attr = FeatureAttributor()

    def test_sorted_by_contribution(self):
        signals = {"shelf_density_index": 0.8, "inventory_value_est": 90000,
                   "geo_footfall_score": 70, "sku_diversity_score": 7,
                   "competition_index": 0.4, "catchment_score": 60,
                   "refill_signal": 0.6, "category_mix": {"category_diversity_score": 0.5}}
        result = self.attr.compute(signals, {"daily_sales": 8000})
        pcts = [r["contribution_pct"] for r in result]
        assert pcts == sorted(pcts, reverse=True)

    def test_competition_negative(self):
        result = self.attr.compute({"competition_index": 0.8}, {})
        comp = next(r for r in result if "Competition" in r["feature"])
        assert comp["direction"] == "negative"

    def test_all_8_features(self):
        assert len(self.attr.compute({}, {})) == 8


class TestMultiImageMerger:
    def setup_method(self):
        from ai_pipeline.vision.multi_image_merger import MultiImageMerger
        self.merger = MultiImageMerger()

    def _mv(self, sdi, image_type="interior"):
        return {"sdi": sdi, "sku_diversity": 6, "refill_signal": 0.5,
                "store_area": "medium", "dominant_categories": ["staples", "snacks"],
                "image_quality": "good", "image_type": image_type}

    def test_consistent_high_score(self):
        merged = self.merger.merge([self._mv(0.7), self._mv(0.72), self._mv(0.68)])
        assert merged["consistency_score"] > 0.8

    def test_inconsistent_low_score(self):
        merged = self.merger.merge([self._mv(0.2), self._mv(0.9), self._mv(0.5)])
        assert merged["consistency_score"] < 0.7

    def test_empty_defaults(self):
        assert self.merger.merge([])["sdi"] == 0.5

    def test_image_type_coverage(self):
        merged = self.merger.merge([
            self._mv(0.7, "interior"), self._mv(0.7, "counter"), self._mv(0.7, "exterior")
        ])
        for t in ("interior", "counter", "exterior"):
            assert t in merged["image_type_coverage"]


class TestAuthService:
    def test_hash_and_verify(self):
        from app.services.auth_service import hash_password, verify_password
        h = hash_password("mypassword123")
        assert verify_password("mypassword123", h)
        assert not verify_password("wrongpassword", h)

    def test_token_roundtrip(self):
        from app.services.auth_service import create_access_token, decode_token
        token = create_access_token("user-123", "test@example.com")
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["email"] == "test@example.com"

    def test_invalid_token_none(self):
        from app.services.auth_service import decode_token
        assert decode_token("not.a.real.token") is None


class TestConfig:
    def test_config_loads(self):
        from app.config import settings
        assert settings.JWT_ALGORITHM == "HS256"
        assert settings.WORKING_DAYS_MONTH == 26
        assert settings.FOIR == 0.45

    def test_storage_backend_default(self):
        from app.config import settings
        assert settings.STORAGE_BACKEND in ("local", "s3")


class TestSignalNormalizer:
    def setup_method(self):
        from ai_pipeline.fusion.signal_normalizer import SignalNormalizer
        self.norm = SignalNormalizer()

    def test_already_normalised_passthrough(self):
        r = self.norm.normalize({"shelf_density_index": 0.75})
        assert r["shelf_density_index"] == pytest.approx(0.75, abs=0.01)

    def test_geo_score_normalised(self):
        r = self.norm.normalize({"geo_footfall_score": 50.0})
        assert 0 <= r["geo_footfall_score"] <= 1

    def test_unknown_key_passthrough(self):
        r = self.norm.normalize({"my_custom_signal": 999})
        assert r["my_custom_signal"] == 999

    def test_clamp_over_max(self):
        r = self.norm.normalize({"geo_footfall_score": 200.0})
        assert r["geo_footfall_score"] == pytest.approx(1.0, abs=0.01)


class TestStoreSizeEstimator:
    def setup_method(self):
        from ai_pipeline.vision.store_size_estimator import StoreSizeEstimator
        self.est = StoreSizeEstimator()

    def test_officer_input_priority(self):
        r = self.est.estimate_from_vision("small", sqft_hint=250)
        assert r["source"] == "officer_input"
        assert r["estimated_sqft"] == 250.0

    def test_vision_label_fallback(self):
        r = self.est.estimate_from_vision("large", sqft_hint=None)
        assert r["source"] == "vision_estimate"
        assert r["estimated_sqft"] > 200

    def test_unknown_label_defaults_medium(self):
        r = self.est.estimate_from_vision("giant_store", sqft_hint=None)
        assert r["size_label"] == "medium"


# ══════════════════════════════════════════════════════════════════════════════
# 2. INTEGRATION TESTS
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.integration
class TestGroqVision:
    def test_analyze_public_image(self):
        from app.config import settings
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith("gsk_..."):
            pytest.skip("GROQ_API_KEY not set")

        import asyncio
        from ai_pipeline.vision.shelf_analyzer import ShelfAnalyzer
        analyzer = ShelfAnalyzer()
        url = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Supermarkt.jpg/1280px-Supermarkt.jpg"
        result = asyncio.run(analyzer.analyze(url))
        assert "sdi" in result
        assert 0 <= result["sdi"] <= 1


@pytest.mark.integration
class TestOverpassGeo:
    def test_footfall_score_delhi(self):
        import asyncio
        from ai_pipeline.geo.footfall_scorer import FootfallScorer
        score = asyncio.run(FootfallScorer().score(28.6562, 77.2310))
        assert 0 <= score <= 100

    def test_competition_density(self):
        import asyncio
        from ai_pipeline.geo.competition_mapper import CompetitionMapper
        idx = asyncio.run(CompetitionMapper().density(28.6562, 77.2310))
        assert 0 <= idx <= 1


# ══════════════════════════════════════════════════════════════════════════════
# 3. FULL PIPELINE SMOKE TEST
# ══════════════════════════════════════════════════════════════════════════════

class TestPipelineSmoke:
    def test_full_pipeline_logic(self):
        from ai_pipeline.fusion.sales_estimator import SalesEstimator
        from ai_pipeline.fusion.uncertainty_engine import UncertaintyEngine
        from ai_pipeline.fusion.feature_attributor import FeatureAttributor
        from ai_pipeline.fraud.cross_signal_validator import CrossSignalValidator
        from ai_pipeline.loan.loan_sizer import LoanSizer
        from ai_pipeline.vision.multi_image_merger import MultiImageMerger

        merger = MultiImageMerger()
        mock_results = [
            {"sdi": 0.75, "sku_diversity": 7, "refill_signal": 0.6,
             "store_area": "medium",
             "dominant_categories": ["staples", "snacks", "beverages"],
             "image_quality": "good", "image_type": t}
            for t in ["interior", "counter", "exterior"]
        ]
        merged = merger.merge(mock_results)

        footfall, comp_index = 68.0, 0.35
        catchment = {"score": 55, "income_proxy": "medium"}
        merged["competition_index"] = comp_index

        fraud = CrossSignalValidator().validate(merged, footfall, catchment)

        signals = {
            "shelf_density_index":  merged["sdi"],
            "sku_diversity_score":  merged["sku_diversity"],
            "inventory_value_est":  merged["inventory_value"],
            "avg_daily_turnover":   merged["avg_daily_turnover"],
            "refill_signal":        merged["refill_signal"],
            "category_mix":         merged["category_mix"],
            "consistency_score":    merged["consistency_score"],
            "n_images_used":        merged["n_images_used"],
            "geo_footfall_score":   footfall,
            "competition_index":    comp_index,
            "catchment_score":      catchment["score"],
            "shop_size_sqft":       150,
            "years_in_operation":   4,
        }

        point   = SalesEstimator().estimate(signals)
        ranges  = UncertaintyEngine().compute_ranges(point, signals, fraud)
        attribs = FeatureAttributor().compute(signals, point)
        loan    = LoanSizer().size(ranges["monthly_income_range"])

        assert ranges["daily_sales_range"][0] < ranges["daily_sales_range"][1]
        assert 0.2 <= ranges["confidence_score"] <= 1.0
        assert len(attribs) > 0
        assert loan["min_loan"] > 0
        assert fraud["recommendation"] in ("approve", "needs_verification", "reject")

        print("\n" + "=" * 52)
        print("  PIPELINE SMOKE TEST RESULTS")
        print("=" * 52)
        print(f"  Daily:    ₹{ranges['daily_sales_range'][0]:,} – ₹{ranges['daily_sales_range'][1]:,}")
        print(f"  Revenue:  ₹{ranges['monthly_revenue_range'][0]:,} – ₹{ranges['monthly_revenue_range'][1]:,}")
        print(f"  Income:   ₹{ranges['monthly_income_range'][0]:,} – ₹{ranges['monthly_income_range'][1]:,}")
        print(f"  Confidence: {ranges['confidence_score']}")
        print(f"  Recommendation: {fraud['recommendation']}")
        print(f"  Loan: ₹{loan['min_loan']:,} – ₹{loan['max_loan']:,}")
        print("=" * 52)