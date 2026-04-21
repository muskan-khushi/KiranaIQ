import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatRange } from '../../utils/formatCurrency';
import { recommendationConfig } from '../../utils/riskColors';
import type { AssessmentResult } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

export default function CashFlowCard({ data }: Props) {
  const rec = data.recommendation ?? 'needs_verification';
  const recConfig = recommendationConfig[rec];

  const RecIcon = rec === 'approve' ? TrendingUp : rec === 'reject' ? TrendingDown : Minus;

  return (
    <div className="card p-6 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/5 translate-x-16 -translate-y-16 pointer-events-none" />

      {/* Recommendation badge */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Cash Flow Estimate</p>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${recConfig.bg} ${recConfig.text} ${recConfig.border}`}>
          <RecIcon size={14} />
          {recConfig.label}
        </div>
      </div>

      {/* Monthly Revenue - hero number */}
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Monthly Revenue Range</p>
        <p className="font-display text-3xl font-bold text-primary leading-none metric-number animate-in stagger-1">
          {data.monthly_revenue_range ? formatRange(data.monthly_revenue_range) : '—'}
        </p>
      </div>

      {/* Grid of other metrics */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted mb-1">Daily Sales Range</p>
          <p className="font-display font-semibold text-base text-primary metric-number">
            {data.daily_sales_range ? formatRange(data.daily_sales_range) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Net Income Range</p>
          <p className="font-display font-semibold text-base text-primary metric-number">
            {data.monthly_income_range ? formatRange(data.monthly_income_range) : '—'}
          </p>
        </div>
      </div>

      {/* Signal pills */}
      <div className="flex flex-wrap gap-2 mt-4">
        {data.shelf_density_index != null && (
          <Pill label="Shelf Density" value={`${Math.round(data.shelf_density_index * 100)}%`} />
        )}
        {data.geo_footfall_score != null && (
          <Pill label="Footfall Score" value={`${Math.round(data.geo_footfall_score)}/100`} />
        )}
        {data.sku_diversity_score != null && (
          <Pill label="SKU Diversity" value={`${data.sku_diversity_score}/10`} />
        )}
        {data.competition_index != null && (
          <Pill label="Competition" value={`${Math.round(data.competition_index * 100)}%`} variant="warning" />
        )}
      </div>
    </div>
  );
}

function Pill({ label, value, variant = 'default' }: { label: string; value: string; variant?: 'default' | 'warning' }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
      variant === 'warning' ? 'bg-warning-light text-warning border-warning/20' : 'bg-surface-2 text-secondary border-border'
    }`}>
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  );
}