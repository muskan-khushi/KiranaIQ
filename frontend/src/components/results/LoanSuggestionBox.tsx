import { Banknote, Calendar, CreditCard, Percent, Info } from 'lucide-react';
import { formatINR, formatRange } from '../../utils/formatCurrency';
import type { AssessmentResult } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

export default function LoanSuggestionBox({ data }: Props) {
  const loan = data.loan_suggestion;
  if (!loan) return null;

  const midLoan = Math.round((loan.min_loan + loan.max_loan) / 2 / 5000) * 5000;

  return (
    <div className="card p-6 relative overflow-hidden">
      {/* Accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent-dark rounded-t-2xl" />

      <div className="flex items-center justify-between mb-5 pt-1">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Loan Recommendation</p>
        <div className="flex items-center gap-1.5 text-xs text-accent font-semibold bg-accent/10 px-2.5 py-1 rounded-full">
          <Banknote size={13} />
          NBFC Grade
        </div>
      </div>

      {/* Hero loan range */}
      <div className="bg-surface-2 rounded-2xl p-4 border border-border mb-4">
        <p className="text-xs text-muted mb-1">Suggested Loan Range</p>
        <p className="font-display text-2xl font-bold text-primary metric-number">
          {formatINR(loan.min_loan)} – {formatINR(loan.max_loan)}
        </p>
        <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full" style={{ width: '70%' }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>Conservative</span><span>Optimal: {formatINR(midLoan)}</span><span>Aggressive</span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <DetailCard
          icon={Calendar}
          label="Tenure"
          value={`${loan.suggested_tenure_months} months`}
        />
        <DetailCard
          icon={Percent}
          label="Interest Rate"
          value={`${(loan.interest_rate_pa * 100).toFixed(0)}% p.a.`}
        />
        <DetailCard
          icon={CreditCard}
          label="Monthly EMI Range"
          value={formatRange(loan.monthly_emi_range)}
          wide
        />
        <DetailCard
          icon={Info}
          label="FOIR Used"
          value={`${(loan.foir_used * 100).toFixed(0)}% (Industry Std.)`}
          wide
        />
      </div>

      {/* Formula note */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-[10px] text-muted font-mono bg-surface-2 px-3 py-2 rounded-lg border border-border">
          Max_Loan = Monthly_Income × FOIR × Annuity_Factor(18% p.a., {loan.suggested_tenure_months}mo)
        </p>
      </div>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value, wide = false }: {
  icon: any; label: string; value: string; wide?: boolean;
}) {
  return (
    <div className={`bg-surface-2 rounded-xl p-3 border border-border ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 text-muted mb-1">
        <Icon size={12} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-primary metric-number">{value}</p>
    </div>
  );
}