from pydantic import BaseModel, Field
from typing import Optional, List, Tuple
from datetime import datetime
from enum import Enum


class AssessmentStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Recommendation(str, Enum):
    approve = "approve"
    needs_verification = "needs_verification"
    reject = "reject"


class RiskFlag(BaseModel):
    code: str
    severity: str  # low | medium | high
    description: str
    recommended_action: str


class FeatureAttribution(BaseModel):
    feature: str
    value: float
    contribution_pct: float
    direction: str  # positive | negative


class PeerBenchmark(BaseModel):
    percentile: float
    n_peers: int
    avg_sdi: float
    avg_footfall: float


class LoanSuggestion(BaseModel):
    min_loan: int
    max_loan: int
    suggested_tenure_months: int
    monthly_emi_range: Tuple[int, int]
    foir_used: float


class PipelineStage(BaseModel):
    stage: str
    status: str  # pending | running | done | failed
    completed_at: Optional[datetime] = None


# ── Request ───────────────────────────────────────────────────────────────────

class AssessmentCreate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    store_address: Optional[str] = Field(None, max_length=500)
    shop_size_sqft: Optional[float] = Field(None, ge=50, le=5000)
    years_in_operation: Optional[int] = Field(None, ge=0, le=100)
    monthly_rent: Optional[float] = Field(None, ge=0)


# ── Response ──────────────────────────────────────────────────────────────────

class AssessmentResponse(BaseModel):
    assessment_id: str
    status: AssessmentStatus
    created_at: datetime
    store_address: Optional[str] = None
    lat: float
    lng: float

    # Core outputs (present when completed)
    daily_sales_range: Optional[Tuple[int, int]] = None
    monthly_revenue_range: Optional[Tuple[int, int]] = None
    monthly_income_range: Optional[Tuple[int, int]] = None
    confidence_score: Optional[float] = None
    recommendation: Optional[Recommendation] = None

    # Signal values
    shelf_density_index: Optional[float] = None
    sku_diversity_score: Optional[float] = None
    geo_footfall_score: Optional[float] = None
    competition_index: Optional[float] = None

    # Detailed results
    risk_flags: List[RiskFlag] = []
    feature_attribution: List[FeatureAttribution] = []
    peer_benchmark: Optional[PeerBenchmark] = None
    loan_suggestion: Optional[LoanSuggestion] = None
    pipeline_stages: List[PipelineStage] = []

    class Config:
        use_enum_values = True


class StatusResponse(BaseModel):
    assessment_id: str
    status: AssessmentStatus
    pipeline_stages: List[PipelineStage] = []

    class Config:
        use_enum_values = True