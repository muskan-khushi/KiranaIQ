import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, IndianRupee } from 'lucide-react';
import { recommendationConfig } from '../../utils/riskColors';
import type { AssessmentResult } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

// ─── Animated INR number ─────────────────────────────────────────────────────

function AnimatedINR({ value, duration = 1200, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const timer = setTimeout(() => {
      const startTime = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, duration, delay]);

  return (
    <span>
      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(display)}
    </span>
  );
}

function AnimatedRange({ range, delay = 0 }: { range: [number, number]; delay?: number }) {
  return (
    <span>
      <AnimatedINR value={range[0]} delay={delay} />
      {' – '}
      <AnimatedINR value={range[1]} delay={delay + 100} />
    </span>
  );
}

// ─── Signal pill ──────────────────────────────────────────────────────────────

function Pill({ label, value, variant = 'default' }: { label: string; value: string; variant?: 'default' | 'warning' }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all hover:scale-105 ${
      variant === 'warning' ? 'bg-warning-light text-warning border-warning/20' : 'bg-surface-2 text-secondary border-border'
    }`}>
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CashFlowCard({ data }: Props) {
  const rec = data.recommendation ?? 'needs_verification';
  const recConfig = recommendationConfig[rec];
  const RecIcon = rec === 'approve' ? TrendingUp : rec === 'reject' ? TrendingDown : Minus;

  return (
    <div className="card p-6 relative overflow-hidden">
      {/* Animated background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/4 translate-x-20 -translate-y-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent/3 -translate-x-12 translate-y-12 pointer-events-none" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Cash Flow Estimate</p>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${recConfig.bg} ${recConfig.text} ${recConfig.border}`}>
          <RecIcon size={14} />
          {recConfig.label}
        </div>
      </div>

      {/* Hero number — Monthly Revenue */}
      <div className="mb-5">
        <p className="text-xs text-muted mb-1.5 flex items-center gap-1">
          <IndianRupee size={11} />
          Monthly Revenue Range
        </p>
        <p className="font-display text-3xl font-bold text-primary leading-none metric-number">
          {data.monthly_revenue_range ? (
            <AnimatedRange range={data.monthly_revenue_range} delay={0} />
          ) : '—'}
        </p>
      </div>

      {/* Two sub-metrics */}
      <div className="grid grid-cols-2 gap-4 mb-5 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted mb-1 flex items-center gap-1">
            <IndianRupee size={10} />
            Daily Sales Range
          </p>
          <p className="font-display font-semibold text-base text-primary metric-number">
            {data.daily_sales_range ? (
              <AnimatedRange range={data.daily_sales_range} delay={200} />
            ) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1 flex items-center gap-1">
            <IndianRupee size={10} />
            Net Income Range
          </p>
          <p className="font-display font-semibold text-base text-primary metric-number">
            {data.monthly_income_range ? (
              <AnimatedRange range={data.monthly_income_range} delay={400} />
            ) : '—'}
          </p>
        </div>
      </div>

      {/* Signal pills */}
      <div className="flex flex-wrap gap-2">
        {data.shelf_density_index != null && (
          <Pill label="Shelf Density" value={`${Math.round(data.shelf_density_index * 100)}%`} />
        )}
        {data.geo_footfall_score != null && (
          <Pill label="Footfall" value={`${Math.round(data.geo_footfall_score)}/100`} />
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