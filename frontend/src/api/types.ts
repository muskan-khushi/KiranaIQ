// ── Assessment Types ──────────────────────────────────────────────────────────

export type AssessmentStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type Recommendation = 'approve' | 'needs_verification' | 'reject';
export type Severity = 'low' | 'medium' | 'high';
export type Direction = 'positive' | 'negative';
export type StageStatus = 'pending' | 'running' | 'done' | 'failed';

export interface RiskFlag {
  code: string;
  severity: Severity;
  description: string;
  recommended_action: string;
}

export interface FeatureAttribution {
  feature: string;
  value: number;
  contribution_pct: number;
  direction: Direction;
}

export interface PeerBenchmark {
  percentile: number;
  n_peers: number;
  avg_sdi: number;
  avg_footfall: number;
}

export interface LoanSuggestion {
  min_loan: number;
  max_loan: number;
  suggested_tenure_months: number;
  monthly_emi_range: [number, number];
  foir_used: number;
  interest_rate_pa: number;
}

export interface PipelineStage {
  stage: string;
  status: StageStatus;
  completed_at: string | null;
}

export interface AssessmentResult {
  assessment_id: string;
  status: AssessmentStatus;
  created_at: string;
  completed_at?: string;
  store_address?: string;
  lat: number;
  lng: number;
  shop_size_sqft?: number;
  years_in_operation?: number;
  monthly_rent?: number;

  // Core outputs
  daily_sales_range?: [number, number];
  monthly_revenue_range?: [number, number];
  monthly_income_range?: [number, number];
  confidence_score?: number;
  recommendation?: Recommendation;

  // Signal values
  shelf_density_index?: number;
  sku_diversity_score?: number;
  geo_footfall_score?: number;
  competition_index?: number;

  // Detailed results
  risk_flags: RiskFlag[];
  feature_attribution: FeatureAttribution[];
  peer_benchmark?: PeerBenchmark;
  loan_suggestion?: LoanSuggestion;
  pipeline_stages: PipelineStage[];
}

export interface StatusResponse {
  assessment_id: string;
  status: AssessmentStatus;
  pipeline_stages: PipelineStage[];
}

// ── Auth Types ────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ── Form Types ────────────────────────────────────────────────────────────────

export interface AssessmentFormData {
  lat: number;
  lng: number;
  store_address?: string;
  shop_size_sqft?: number;
  years_in_operation?: number;
  monthly_rent?: number;
}