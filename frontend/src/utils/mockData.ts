export const MOCK_ASSESSMENT_RESULT = {
  daily_sales_range: [6000, 9000],
  monthly_revenue_range: [180000, 270000],
  monthly_income_range: [25000, 45000],
  confidence_score: 0.72,
  risk_flags: [
    {
      code: "inventory_footfall_mismatch",
      severity: "high",
      description: "High inventory density detected but geo footfall score is low.",
      recommended_action: "Conduct physical visit to verify actual inventory."
    }
  ],
  recommendation: "needs_verification",
  shelf_density_index: 0.78,
  sku_diversity_score: 6.2,
  geo_footfall_score: 71,
  competition_index: 0.44,
  loan_suggestion: {
    min_loan: 120000,
    max_loan: 280000,
    suggested_tenure_months: 24,
    monthly_emi_range: [5900, 13800]
  }
};