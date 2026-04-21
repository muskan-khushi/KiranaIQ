"""
KiranaIQ Master Pipeline
Runs all 5 stages in order, updating MongoDB stage status in real-time.

Stage order:
  1. Vision   — Groq multimodal analysis of each image (parallel)
  2. Geo      — OSM footfall + competition + catchment (parallel)
  3. Fraud    — Cross-signal tripwire validation + optional video temporal analysis
  4. Fusion   — Sales estimation + uncertainty ranges + attribution
  5. Loan     — FOIR-based loan sizing + peer benchmarking
"""

import asyncio
import sys
import os
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
from ai_pipeline.fraud.temporal_analyzer import TemporalAnalyzer
from ai_pipeline.loan.loan_sizer import LoanSizer
from ai_pipeline.benchmarking.peer_comparator import PeerComparator


class KiranaIQPipeline:
    def __init__(self):
        self.shelf       = ShelfAnalyzer()
        self.merger      = MultiImageMerger()
        self.footfall    = FootfallScorer()
        self.competition = CompetitionMapper()
        self.catchment   = CatchmentAnalyzer()
        self.estimator   = SalesEstimator()
        self.uncertainty = UncertaintyEngine()
        self.attributor  = FeatureAttributor()
        self.fraud       = CrossSignalValidator()
        self.temporal    = TemporalAnalyzer()
        self.loan        = LoanSizer()
        self.peer        = PeerComparator()

    async def run(
        self,
        assessment_id: str,
        image_urls: list[str],
        lat: float,
        lng: float,
        video_url: str | None = None,
        optional_inputs: dict | None = None,
    ) -> dict:
        # Strip None values so they never corrupt numeric calculations
        optional_inputs = {
            k: v for k, v in (optional_inputs or {}).items()
            if v is not None
        }

        from app.db.repositories.assessment_repo import AssessmentRepository
        repo = AssessmentRepository()

        # ── Stage 1: Vision ───────────────────────────────────────────────────
        await repo.update(assessment_id, {"status": "processing"})
        await repo.update_stage(assessment_id, "vision", "running")

        if image_urls:
            vision_results = await asyncio.gather(
                *[self.shelf.analyze(url) for url in image_urls],
                return_exceptions=True,
            )
            vision_results = [
                r if isinstance(r, dict) else self.shelf._normalize({})
                for r in vision_results
            ]
        else:
            # No images — use empty fallback (will trigger fraud flag)
            vision_results = []

        merged_vision = self.merger.merge(vision_results)
        await repo.update_stage(assessment_id, "vision", "done")

        # ── Stage 2: Geo (parallel) ───────────────────────────────────────────
        await repo.update_stage(assessment_id, "geo", "running")

        footfall_score, comp_index, catchment = await asyncio.gather(
            self.footfall.score(lat, lng),
            self.competition.density(lat, lng),
            self.catchment.analyze(lat, lng),
        )
        await repo.update_stage(assessment_id, "geo", "done")

        # ── Stage 3: Fraud ────────────────────────────────────────────────────
        await repo.update_stage(assessment_id, "fraud", "running")

        merged_vision["competition_index"] = comp_index

        # Cross-signal fraud detection
        fraud_result = self.fraud.validate(
            vision=merged_vision,
            footfall=footfall_score,
            catchment=catchment,
        )

        # Temporal video analysis (optional)
        if video_url:
            temporal_result = await self.temporal.analyze(video_url)
            if temporal_result.get("flag"):
                fraud_result = dict(fraud_result)
                fraud_result["flags"] = list(fraud_result["flags"]) + [temporal_result["flag"]]

                # Re-evaluate recommendation with the extra flag included
                high_count = sum(
                    1 for f in fraud_result["flags"] if f.get("severity") == "high"
                )
                if high_count >= 2:
                    fraud_result["recommendation"] = "reject"
                elif high_count == 1 or len(fraud_result["flags"]) >= 3:
                    fraud_result["recommendation"] = "needs_verification"

            merged_vision["temporal_stability_score"] = temporal_result.get(
                "temporal_stability_score", 0.8
            )

        await repo.update_stage(assessment_id, "fraud", "done")

        # ── Stage 4: Fusion ───────────────────────────────────────────────────
        await repo.update_stage(assessment_id, "fusion", "running")

        # Build signals dict — only include optional_inputs that have real values
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
        }
        # Only merge non-None optional inputs
        signals.update(optional_inputs)

        point_estimate = self.estimator.estimate(signals)
        ranges         = self.uncertainty.compute_ranges(point_estimate, signals, fraud_result)
        attribution    = self.attributor.compute(signals, point_estimate)
        await repo.update_stage(assessment_id, "fusion", "done")

        # ── Stage 5: Loan + Peer Benchmark ────────────────────────────────────
        await repo.update_stage(assessment_id, "loan", "running")

        loan = self.loan.size(ranges["monthly_income_range"])
        peer = await self.peer.compare(lat, lng, signals)
        await repo.update_stage(assessment_id, "loan", "done")

        # ── Final result ──────────────────────────────────────────────────────
        return {
            "daily_sales_range":     list(ranges["daily_sales_range"]),
            "monthly_revenue_range": list(ranges["monthly_revenue_range"]),
            "monthly_income_range":  list(ranges["monthly_income_range"]),
            "confidence_score":      ranges["confidence_score"],
            "recommendation":        fraud_result["recommendation"],
            "risk_flags":            fraud_result["flags"],
            "shelf_density_index":   merged_vision["sdi"],
            "sku_diversity_score":   merged_vision["sku_diversity"],
            "geo_footfall_score":    footfall_score,
            "competition_index":     comp_index,
            "feature_attribution":   attribution,
            "peer_benchmark":        peer,
            "loan_suggestion":       loan,
            # Extra fields for the server-side PDF service
            "margin_used":           point_estimate.get("margin_used"),
        }