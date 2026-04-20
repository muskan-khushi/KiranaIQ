import { MOCK_ASSESSMENT_RESULT } from '../../utils/mockData';
// Import your icons from lucide-react

export default function AssessmentResult() {
  const data = MOCK_ASSESSMENT_RESULT;

  return (
    <div className="min-h-screen bg-background p-8 font-sans text-primary">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
        <p className="text-muted mt-2">KiranaIQ Underwriting Engine</p>
      </header>

      {/* Main 6-Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Cash Flow Summary */}
        <div className="col-span-1 md:col-span-2 bg-surface rounded-2xl p-6 shadow-aesthetic border border-border">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Estimated Cash Flow</h2>
          <div className="text-4xl font-bold text-primary">
            ₹{data.monthly_revenue_range[0].toLocaleString()} – ₹{data.monthly_revenue_range[1].toLocaleString()}
          </div>
          <p className="text-sm text-muted mt-2">Monthly Revenue Range</p>
        </div>

        {/* Panel 2: Confidence Gauge */}
        <div className="col-span-1 bg-surface rounded-2xl p-6 shadow-aesthetic border border-border flex flex-col items-center justify-center">
           <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 w-full text-left">Confidence</h2>
           {/* Placeholder for Recharts RadialBarChart */}
           <div className="text-5xl font-bold text-success">{data.confidence_score * 100}%</div>
        </div>

        {/* Panel 3: Risk Flags */}
        <div className="col-span-1 md:col-span-2 bg-surface rounded-2xl p-6 shadow-aesthetic border border-border">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Risk Flags</h2>
          {/* Map through data.risk_flags here */}
        </div>

        {/* Panel 6: Loan Suggestion */}
        <div className="col-span-1 bg-surface rounded-2xl p-6 shadow-aesthetic border border-warning/30 bg-warning/5">
           <h2 className="text-sm font-semibold text-warning uppercase tracking-wider mb-4">Loan Recommendation</h2>
           <div className="text-2xl font-bold text-primary">
             ₹{(data.loan_suggestion.min_loan / 100000).toFixed(1)}L – ₹{(data.loan_suggestion.max_loan / 100000).toFixed(1)}L
           </div>
           <p className="text-sm text-muted mt-2">Suggested amount at 18% p.a.</p>
        </div>

      </div>
    </div>
  );
}