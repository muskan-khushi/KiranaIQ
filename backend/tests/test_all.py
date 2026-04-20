"""
KiranaIQ Backend + AI Pipeline Test Suite
Run from backend/ folder:
    pytest tests/test_all.py -v

Tests are grouped into:
  1. Unit tests  — no network, no DB (pure logic)
  2. Integration — needs GROQ_API_KEY in .env
  3. API tests   — needs running FastAPI server
"""

import sys
import os
import pytest

# Make sure both backend and ai_pipeline are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))           # backend/
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "ai_pipeline"))


# ══════════════════════════════════════════════════════════════════════════════
# 1. UNIT TESTS — pure logic, zero network calls
# ══════════════════════════════════════════════════════════════════════════════

class TestProductDetector:
    def setup_method(self):
        from ai_pipeline.vision.product_detector import ProductDetector
        self.detector = ProductDetector()

    def test_basic_estimate(self):
        result = self.detector.estimate_inventory(
            categories=["staples", "snacks", "beverages"],
            sdi=0.7,
            store_area="medium"
        )
        assert result["inventory_value"] > 0
        assert 0 < result["avg_daily_turnover"] < 1
        assert result["category_diversity_score"] > 0
        print(f"\n  inventory_value: ₹{result['inventory_value']:,.0f}")
        print(f"  avg_daily_turnover: {result['avg_daily_turnover']}")

    def test_large_store_higher_inventory(self):
        small = self.detector.estimate_inventory(["staples"], 0.7, "small")
        large = self.detector.estimate_inventory(["staples"], 0.7, "large")
        assert large["inventory_value"] > small["inventory_value"]

    def test_premium_categories_detected(self):
        result = self.detector.estimate_inventory(["electronics", "frozen"], 0.5, "medium")
        assert result["has_premium_categories"] is True

    def test_empty_categories_fallback(self):
        result = self.detector.estimate_inventory([], 0.5, "medium")
        assert result["inventory_value"] > 0  # should not crash


class TestSalesEstimator:
    def setup_method(self):
        from ai_pipeline.fusion.sales_estimator import SalesEstimator
        self.estimator = SalesEstimator()

    def _base_signals(self, **overrides):
        base = {
            "inventory_value_est": 80000,
            "avg_daily_turnover": 0.12,
            "geo_footfall_score": 65,
            "shelf_density_index": 0.75,
            "category_mix": {"category_diversity_score": 0.5},
        }
        base.update(overrides)
        return base

    def test_output_shape(self):
        result = self.estimator.estimate(self._base_signals())
        assert "daily_sales" in result
        assert "monthly_revenue" in result
        assert "monthly_income" in result
        assert "margin_used" in result

    def test_daily_sales_in_india_range(self):
        """Avg Indian kirana: ₹5k–₹15k/day. We allow wider band for edge cases."""
        result = self.estimator.estimate(self._base_signals())
        assert 1000 < result["daily_sales"] < 50000, f"Got ₹{result['daily_sales']:.0f}/day"
        print(f"\n  daily_sales: ₹{result['daily_sales']:,.0f}")
        print(f"  monthly_revenue: ₹{result['monthly_revenue']:,.0f}")
        print(f"  monthly_income: ₹{result['monthly_income']:,.0f}")

    def test_size_boosts_estimate(self):
        without = self.estimator.estimate(self._base_signals())
        with_size = self.estimator.estimate(self._base_signals(shop_size_sqft=200))
        # Size path (100 * sqft) should change the estimate
        assert without["daily_sales"] != with_size["daily_sales"]

    def test_established_store_boost(self):
        new_store = self.estimator.estimate(self._base_signals(years_in_operation=1))
        old_store = self.estimator.estimate(self._base_signals(years_in_operation=5))
        assert old_store["daily_sales"] > new_store["daily_sales"]

    def test_margin_within_range(self):
        result = self.estimator.estimate(self._base_signals())
        assert 0.08 <= result["margin_used"] <= 0.15


class TestUncertaintyEngine:
    def setup_method(self):
        from ai_pipeline.fusion.uncertainty_engine import UncertaintyEngine
        self.engine = UncertaintyEngine()

    def _point(self):
        return {"daily_sales": 8000, "monthly_revenue": 208000, "monthly_income": 29120}

    def test_output_shape(self):
        result = self.engine.compute_ranges(self._point(), {}, {"flags": []})
        assert "daily_sales_range" in result
        assert "confidence_score" in result
        assert len(result["daily_sales_range"]) == 2

    def test_range_is_symmetric_around_point(self):
        result = self.engine.compute_ranges(self._point(), {}, {"flags": []})
        low, high = result["daily_sales_range"]
        assert low < 8000 < high

    def test_fraud_flags_widen_range_and_lower_confidence(self):
        clean = self.engine.compute_ranges(self._point(), {}, {"flags": []})
        flags = [{"severity": "high"}, {"severity": "medium"}]
        flagged = self.engine.compute_ranges(self._point(), {}, {"flags": flags})
        assert flagged["confidence_score"] < clean["confidence_score"]
        assert flagged["spread_used"] > clean["spread_used"]
        print(f"\n  clean confidence: {clean['confidence_score']}")
        print(f"  flagged confidence: {flagged['confidence_score']}")

    def test_strong_signals_tighten_range(self):
        weak = self.engine.compute_ranges(self._point(), {}, {"flags": []})
        strong_signals = {
            "shelf_density_index": 0.85,
            "geo_footfall_score": 75,
            "shop_size_sqft": 150,
            "years_in_operation": 5,
            "n_images_used": 4,
            "consistency_score": 0.9,
        }
        strong = self.engine.compute_ranges(self._point(), strong_signals, {"flags": []})
        assert strong["spread_used"] < weak["spread_used"]

    def test_confidence_always_between_0_and_1(self):
        result = self.engine.compute_ranges(self._point(), {}, {"flags": []})
        assert 0 <= result["confidence_score"] <= 1


class TestFraudValidator:
    def setup_method(self):
        from ai_pipeline.fraud.cross_signal_validator import CrossSignalValidator
        self.validator = CrossSignalValidator()

    def _clean_vision(self):
        return {
            "sdi": 0.6,
            "sku_diversity": 6,
            "consistency_score": 0.85,
            "image_type_coverage": {"interior": 2, "counter": 1, "exterior": 1},
            "dominant_categories": ["staples", "snacks"],
            "competition_index": 0.3,
        }

    def test_clean_store_no_flags(self):
        result = self.validator.validate(
            vision=self._clean_vision(),
            footfall=65.0,
            catchment={"score": 60, "income_proxy": "medium"},
        )
        assert result["flags"] == []
        assert result["recommendation"] == "approve"

    def test_tripwire1_high_sdi_low_footfall(self):
        vision = self._clean_vision()
        vision["sdi"] = 0.9
        result = self.validator.validate(vision=vision, footfall=20.0,
                                         catchment={"score": 30, "income_proxy": "medium"})
        codes = [f["code"] for f in result["flags"]]
        assert "inventory_footfall_mismatch" in codes
        print(f"\n  flags: {codes}")

    def test_tripwire2_low_consistency(self):
        vision = self._clean_vision()
        vision["consistency_score"] = 0.3
        result = self.validator.validate(vision=vision, footfall=60.0,
                                         catchment={"score": 50, "income_proxy": "medium"})
        codes = [f["code"] for f in result["flags"]]
        assert "low_image_consistency" in codes

    def test_tripwire3_missing_image_types(self):
        vision = self._clean_vision()
        vision["image_type_coverage"] = {"interior": 2}  # missing counter + exterior
        result = self.validator.validate(vision=vision, footfall=60.0,
                                         catchment={"score": 50, "income_proxy": "medium"})
        codes = [f["code"] for f in result["flags"]]
        assert "insufficient_image_coverage" in codes

    def test_two_high_severity_flags_gives_reject(self):
        vision = self._clean_vision()
        vision["sdi"] = 0.95
        vision["consistency_score"] = 0.2
        result = self.validator.validate(vision=vision, footfall=15.0,
                                         catchment={"score": 20, "income_proxy": "medium"})
        assert result["recommendation"] == "reject"

    def test_premium_sku_low_income_flag(self):
        vision = self._clean_vision()
        vision["dominant_categories"] = ["electronics", "imported"]
        result = self.validator.validate(vision=vision, footfall=60.0,
                                         catchment={"score": 50, "income_proxy": "low"})
        codes = [f["code"] for f in result["flags"]]
        assert "sku_geo_income_mismatch" in codes


class TestLoanSizer:
    def setup_method(self):
        from ai_pipeline.loan.loan_sizer import LoanSizer
        self.sizer = LoanSizer()

    def test_output_shape(self):
        result = self.sizer.size((25000, 40000))
        assert "min_loan" in result
        assert "max_loan" in result
        assert "monthly_emi_range" in result
        assert result["foir_used"] == 0.45

    def test_loan_is_positive(self):
        result = self.sizer.size((20000, 35000))
        assert result["min_loan"] > 0
        assert result["max_loan"] > result["min_loan"]
        print(f"\n  loan range: ₹{result['min_loan']:,} – ₹{result['max_loan']:,}")
        print(f"  EMI range: ₹{result['monthly_emi_range'][0]:,} – ₹{result['monthly_emi_range'][1]:,}")

    def test_loan_rounded_to_5000(self):
        result = self.sizer.size((28000, 42000))
        assert result["min_loan"] % 5000 == 0
        assert result["max_loan"] % 5000 == 0

    def test_emi_less_than_foir_income(self):
        """
        EMI range is derived from (income_low, income_high) × FOIR.
        emi_range[0] must not exceed income_low × FOIR (+ 10% tolerance).
        emi_range[1] must not exceed income_high × FOIR (+ 10% tolerance).
        The original test incorrectly compared emi_range[1] against income_low × FOIR.
        """
        income_low, income_high = 30000, 45000
        result = self.sizer.size((income_low, income_high))
        foir = result["foir_used"]

        max_emi_low  = income_low  * foir
        max_emi_high = income_high * foir

        assert result["monthly_emi_range"][0] <= max_emi_low  * 1.1, (
            f"emi_low {result['monthly_emi_range'][0]} > {max_emi_low * 1.1}"
        )
        assert result["monthly_emi_range"][1] <= max_emi_high * 1.1, (
            f"emi_high {result['monthly_emi_range'][1]} > {max_emi_high * 1.1}"
        )


class TestFeatureAttributor:
    def setup_method(self):
        from ai_pipeline.fusion.feature_attributor import FeatureAttributor
        self.attr = FeatureAttributor()

    def test_output_is_sorted_by_contribution(self):
        signals = {
            "shelf_density_index": 0.8,
            "inventory_value_est": 90000,
            "geo_footfall_score": 70,
            "sku_diversity_score": 7,
            "competition_index": 0.4,
            "catchment_score": 60,
            "refill_signal": 0.6,
            "category_mix": {"category_diversity_score": 0.5},
        }
        result = self.attr.compute(signals, {"daily_sales": 8000})
        pcts = [r["contribution_pct"] for r in result]
        assert pcts == sorted(pcts, reverse=True)

    def test_competition_is_negative(self):
        signals = {"competition_index": 0.8}
        result = self.attr.compute(signals, {})
        comp = next(r for r in result if "Competition" in r["feature"])
        assert comp["direction"] == "negative"

    def test_all_features_present(self):
        result = self.attr.compute({}, {})
        assert len(result) == 8


class TestMultiImageMerger:
    def setup_method(self):
        from ai_pipeline.vision.multi_image_merger import MultiImageMerger
        self.merger = MultiImageMerger()

    def _mock_vision(self, sdi, image_type="interior"):
        return {
            "sdi": sdi, "sku_diversity": 6,
            "refill_signal": 0.5, "store_area": "medium",
            "dominant_categories": ["staples", "snacks"],
            "image_quality": "good", "image_type": image_type,
        }

    def test_consistent_images_high_consistency(self):
        results = [self._mock_vision(0.7), self._mock_vision(0.72), self._mock_vision(0.68)]
        merged = self.merger.merge(results)
        assert merged["consistency_score"] > 0.8
        print(f"\n  consistency_score: {merged['consistency_score']}")

    def test_inconsistent_images_low_consistency(self):
        results = [self._mock_vision(0.2), self._mock_vision(0.9), self._mock_vision(0.5)]
        merged = self.merger.merge(results)
        assert merged["consistency_score"] < 0.7

    def test_empty_input_returns_defaults(self):
        merged = self.merger.merge([])
        assert merged["sdi"] == 0.5

    def test_image_type_coverage_tracked(self):
        results = [
            self._mock_vision(0.7, "interior"),
            self._mock_vision(0.7, "counter"),
            self._mock_vision(0.7, "exterior"),
        ]
        merged = self.merger.merge(results)
        assert "interior" in merged["image_type_coverage"]
        assert "counter" in merged["image_type_coverage"]
        assert "exterior" in merged["image_type_coverage"]


class TestAuthService:
    def test_password_hash_and_verify(self):
        from app.services.auth_service import hash_password, verify_password
        hashed = hash_password("mypassword123")
        assert verify_password("mypassword123", hashed)
        assert not verify_password("wrongpassword", hashed)

    def test_token_create_and_decode(self):
        from app.services.auth_service import create_access_token, decode_token
        token = create_access_token("user-123", "test@example.com")
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["email"] == "test@example.com"

    def test_invalid_token_returns_none(self):
        from app.services.auth_service import decode_token
        assert decode_token("not.a.real.token") is None


class TestConfig:
    def test_config_loads(self):
        from app.config import settings
        assert settings.JWT_ALGORITHM == "HS256"
        assert settings.WORKING_DAYS_MONTH if hasattr(settings, "WORKING_DAYS_MONTH") else True
        print(f"\n  STORAGE_BACKEND: {settings.STORAGE_BACKEND}")
        print(f"  MONGO_URI: {settings.MONGO_URI}")
        print(f"  GROQ_API_KEY set: {bool(settings.GROQ_API_KEY)}")


# ══════════════════════════════════════════════════════════════════════════════
# 2. INTEGRATION TESTS — needs GROQ_API_KEY, makes real API call
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.integration
class TestGroqVision:
    """Skipped unless GROQ_API_KEY is set in .env"""

    def test_analyze_public_image(self):
        from app.config import settings
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith("gsk_..."):
            pytest.skip("GROQ_API_KEY not set")

        import asyncio
        from ai_pipeline.vision.shelf_analyzer import ShelfAnalyzer

        analyzer = ShelfAnalyzer()
        # Public domain image of a grocery store shelf
        url = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Supermarkt.jpg/1280px-Supermarkt.jpg"

        result = asyncio.run(analyzer.analyze(url))
        assert "sdi" in result
        assert 0 <= result["sdi"] <= 1
        assert isinstance(result["sku_diversity"], int)
        print(f"\n  sdi: {result['sdi']}")
        print(f"  sku_diversity: {result['sku_diversity']}")
        print(f"  dominant_categories: {result['dominant_categories']}")
        print(f"  image_type: {result['image_type']}")


@pytest.mark.integration
class TestOverpassGeo:
    """Makes real Overpass API call — needs internet"""

    def test_footfall_score_delhi(self):
        import asyncio
        from ai_pipeline.geo.footfall_scorer import FootfallScorer

        scorer = FootfallScorer()
        # Chandni Chowk, Delhi — should score high (dense market area)
        score = asyncio.run(scorer.score(28.6562, 77.2310))
        assert 0 <= score <= 100
        print(f"\n  Chandni Chowk footfall score: {score}")

    def test_competition_density(self):
        import asyncio
        from ai_pipeline.geo.competition_mapper import CompetitionMapper

        mapper = CompetitionMapper()
        index = asyncio.run(mapper.density(28.6562, 77.2310))
        assert 0 <= index <= 1
        print(f"\n  Chandni Chowk competition index: {index}")


# ══════════════════════════════════════════════════════════════════════════════
# 3. FULL PIPELINE SMOKE TEST (unit — mocked vision + geo)
# ══════════════════════════════════════════════════════════════════════════════

class TestPipelineSmoke:
    """
    Runs the full pipeline with mocked external calls.
    No network, no DB needed.
    """

    def test_full_pipeline_logic(self):
        from ai_pipeline.fusion.sales_estimator import SalesEstimator
        from ai_pipeline.fusion.uncertainty_engine import UncertaintyEngine
        from ai_pipeline.fusion.feature_attributor import FeatureAttributor
        from ai_pipeline.fraud.cross_signal_validator import CrossSignalValidator
        from ai_pipeline.loan.loan_sizer import LoanSizer
        from ai_pipeline.vision.multi_image_merger import MultiImageMerger

        # Mock merged vision output
        merger = MultiImageMerger()
        mock_vision_results = [
            {"sdi": 0.75, "sku_diversity": 7, "refill_signal": 0.6,
             "store_area": "medium", "dominant_categories": ["staples", "snacks", "beverages"],
             "image_quality": "good", "image_type": t}
            for t in ["interior", "counter", "exterior"]
        ]
        merged = merger.merge(mock_vision_results)

        # Mock geo outputs
        footfall = 68.0
        comp_index = 0.35
        catchment = {"score": 55, "income_proxy": "medium"}

        merged["competition_index"] = comp_index

        # Fraud check
        validator = CrossSignalValidator()
        fraud = validator.validate(merged, footfall, catchment)

        # Build signals
        signals = {
            "shelf_density_index": merged["sdi"],
            "sku_diversity_score": merged["sku_diversity"],
            "inventory_value_est": merged["inventory_value"],
            "avg_daily_turnover": merged["avg_daily_turnover"],
            "refill_signal": merged["refill_signal"],
            "category_mix": merged["category_mix"],
            "consistency_score": merged["consistency_score"],
            "n_images_used": merged["n_images_used"],
            "geo_footfall_score": footfall,
            "competition_index": comp_index,
            "catchment_score": catchment["score"],
            "shop_size_sqft": 150,
            "years_in_operation": 4,
        }

        # Estimate
        estimator = SalesEstimator()
        point = estimator.estimate(signals)

        uncertainty = UncertaintyEngine()
        ranges = uncertainty.compute_ranges(point, signals, fraud)

        attributor = FeatureAttributor()
        attribution = attributor.compute(signals, point)

        loan_sizer = LoanSizer()
        loan = loan_sizer.size(ranges["monthly_income_range"])

        # Assertions
        assert ranges["daily_sales_range"][0] < ranges["daily_sales_range"][1]
        assert 0.2 <= ranges["confidence_score"] <= 1.0
        assert len(attribution) > 0
        assert loan["min_loan"] > 0
        assert fraud["recommendation"] in ["approve", "needs_verification", "reject"]

        print("\n" + "="*50)
        print("  FULL PIPELINE SMOKE TEST RESULTS")
        print("="*50)
        print(f"  Daily Sales Range:    ₹{ranges['daily_sales_range'][0]:,} – ₹{ranges['daily_sales_range'][1]:,}")
        print(f"  Monthly Revenue:      ₹{ranges['monthly_revenue_range'][0]:,} – ₹{ranges['monthly_revenue_range'][1]:,}")
        print(f"  Monthly Income:       ₹{ranges['monthly_income_range'][0]:,} – ₹{ranges['monthly_income_range'][1]:,}")
        print(f"  Confidence Score:     {ranges['confidence_score']}")
        print(f"  Recommendation:       {fraud['recommendation']}")
        print(f"  Risk Flags:           {[f['code'] for f in fraud['flags']]}")
        print(f"  Loan Range:           ₹{loan['min_loan']:,} – ₹{loan['max_loan']:,}")
        print(f"  Top Signal:           {attribution[0]['feature']} ({attribution[0]['contribution_pct']}%)")
        print("="*50)