"""
KiranaIQ Master Pipeline
Runs all 5 stages in order, updating MongoDB stage status in real-time
so the frontend progress tracker stays live.

Stage order:
  1. Vision   — Groq multimodal analysis of each image (parallel)
  2. Geo      — OSM footfall + competition + catchment (parallel)
  3. Fraud    — Cross-signal tripwire validation
  4. Fusion   — Sales estimation + uncertainty ranges + attribution
  5. Loan     — FOIR-based loan sizing + peer benchmarking
"""

import asyncio
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from ai_pipeline.vision.shelf_analyzer import ShelfAnalyzer
from ai_pipeline.vision.multi_image_merger import MultiImageMerger
from ai_pipeline.geo.footfall_scorer import FootfallScorer
from ai_pipeline.geo.competition_mapper import CompetitionMapper
from ai_pipeline.geo.catchment_analyzer import CatchmentAnalyzer
from ai_pipeline.fusion.sales_estimator import SalesEstimator
from ai_pipeline.fusion.uncertainty_engine import UncertaintyEngine
from ai_pipeline.fusion.feature_attributor import FeatureAttributor
from ai_pipeline.fraud.cross_signal_validator import CrossSignalValidator
from ai_pipeline.loan.loan_sizer import LoanSizer
from ai_pipeline.benchmarking.peer_comparator import PeerComparator


class KiranaIQPipeline:
    def __init__(self):
        self.shelf      = ShelfAnalyzer()
        self.merger     = MultiImageMerger()
        self.footfall   = FootfallScorer()
        self.competition= CompetitionMapper()
        self.catchment  = CatchmentAnalyzer()
        self.estimator  = SalesEstimator()
        self.uncertainty= UncertaintyEngine()
        self.attributor = FeatureAttributor()
        self.fraud      = CrossSignalValidator()
        self.loan       = LoanSizer()
        self.peer       = PeerComparator()

    async def run(
        self,
        assessment_id: str,
        image_urls: list[str],
        lat: float,
        lng: float,
        video_url: str | None = None,
        optional_inputs: dict | None = None,
    ) -> dict:
        optional_inputs = optional_inputs or {}

        # Lazy import repo (needs live DB connection inside Celery worker)
        from app.db.repositories.assessment_repo import AssessmentRepository
        repo = AssessmentRepository()

        # ── Stage 1: Vision ───────────────────────────────────────────────────
        await repo.update(assessment_id, {"status": "processing"})
        await repo.update_stage(assessment_id, "vision", "running")

        vision_results = await asyncio.gather(
            *[self.shelf.analyze(url) for url in image_urls],
            return_exceptions=True,
        )
        # Replace exceptions with neutral defaults
        vision_results = [
            r if isinstance(r, dict) else self.shelf._normalize({})
            for r in vision_results
        ]
        merged_vision = self.merger.merge(vision_results)
        await repo.update_stage(assessment_id, "vision", "done")

        # ── Stage 2: Geo ──────────────────────────────────────────────────────
        await repo.update_stage(assessment_id, "geo", "running")

        footfall_score, comp_index, catchment = await asyncio.gather(
            self.footfall.score(lat, lng),
            self.competition.density(lat, lng),
            self.catchment.analyze(lat, lng),
        )
        await repo.update_stage(assessment_id, "geo", "done")

        # ── Stage 3: Fraud ────────────────────────────────────────────────────
        await repo.update_stage(assessment_id, "fraud", "running")

        # Pass competition index into vision dict so fraud validator can use it
        merged_vision["competition_index"] = comp_index

        fraud_result = self.fraud.validate(
            vision=merged_vision,
            footfall=footfall_score,
            catchment=catchment,
        )
        await repo.update_stage(assessment_id, "fraud", "done")

        # ── Stage 4: Fusion ───────────────────────────────────────────────────
        await repo.update_stage(assessment_id, "fusion", "running")

        signals = {
            "shelf_density_index":  merged_vision["sdi"],
            "sku_diversity_score":  merged_vision["sku_diversity"],
            "inventory_value_est":  merged_vision["inventory_value"],
            "avg_daily_turnover":   merged_vision["avg_daily_turnover"],
            "refill_signal":        merged_vision["refill_signal"],
            "category_mix":         merged_vision["category_mix"],
            "consistency_score":    merged_vision["consistency_score"],
            "n_images_used":        merged_vision["n_images_used"],
            "geo_footfall_score":   footfall_score,
            "competition_index":    comp_index,
            "catchment_score":      catchment["score"],
            **optional_inputs,
        }

        point_estimate = self.estimator.estimate(signals)
        ranges = self.uncertainty.compute_ranges(point_estimate, signals, fraud_result)
        attribution = self.attributor.compute(signals, point_estimate)
        await repo.update_stage(assessment_id, "fusion", "done")

        # ── Stage 5: Loan + Peer Benchmark ────────────────────────────────────
        await repo.update_stage(assessment_id, "loan", "running")

        loan = self.loan.size(ranges["monthly_income_range"])
        peer = await self.peer.compare(lat, lng, signals)
        await repo.update_stage(assessment_id, "loan", "done")

        # ── Final result document ─────────────────────────────────────────────
        return {
            "daily_sales_range":    list(ranges["daily_sales_range"]),
            "monthly_revenue_range":list(ranges["monthly_revenue_range"]),
            "monthly_income_range": list(ranges["monthly_income_range"]),
            "confidence_score":     ranges["confidence_score"],
            "recommendation":       fraud_result["recommendation"],
            "risk_flags":           fraud_result["flags"],
            "shelf_density_index":  merged_vision["sdi"],
            "sku_diversity_score":  merged_vision["sku_diversity"],
            "geo_footfall_score":   footfall_score,
            "competition_index":    comp_index,
            "feature_attribution":  attribution,
            "peer_benchmark":       peer,
            "loan_suggestion":      loan,
        }