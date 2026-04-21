import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusCircle, ChevronRight, TrendingUp, TrendingDown, Minus,
  Clock, CheckCircle2, XCircle, Loader2, Activity, BarChart2,
  IndianRupee, ShieldCheck, MapPin, Cpu
} from 'lucide-react';
import { listAssessments } from '../api/assessment.api';
import { formatRangeLakh, formatPercent, formatLakh } from '../utils/formatCurrency';
import type { AssessmentResult, Recommendation } from '../api/types';

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

// ─── Mini sparkline ──────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="flex-shrink-0 opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RecIcon = ({ rec }: { rec?: Recommendation }) => {
  if (rec === 'approve') return <TrendingUp size={14} className="text-success" />;
  if (rec === 'reject') return <TrendingDown size={14} className="text-danger" />;
  return <Minus size={14} className="text-warning" />;
};

const StatusDot = ({ status }: { status: string }) => {
  if (status === 'completed') return <CheckCircle2 size={14} className="text-success" />;
  if (status === 'failed') return <XCircle size={14} className="text-danger" />;
  if (status === 'processing') return <Loader2 size={14} className="text-accent animate-spin" />;
  return <Clock size={14} className="text-muted" />;
};

function borderColor(rec?: Recommendation) {
  if (rec === 'approve') return 'border-l-success';
  if (rec === 'reject') return 'border-l-danger';
  return 'border-l-warning';
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, animated = false, rawValue = 0, suffix = '',
}: {
  icon: React.ElementType; label: string; value?: string; sub?: string;
  color?: string; animated?: boolean; rawValue?: number; suffix?: string;
}) {
  const count = useCountUp(animated ? rawValue : 0);
  const display = animated ? `${count}${suffix}` : value;
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className={color ?? 'text-muted'} />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-display text-xl font-bold text-primary metric-number mt-0.5">{display}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: assessments, isLoading, error } = useQuery<AssessmentResult[]>({
    queryKey: ['assessments'],
    queryFn: () => listAssessments(),
    staleTime: 30000,
  });

  const completed = assessments?.filter(a => a.status === 'completed') ?? [];
  const approvals = completed.filter(a => a.recommendation === 'approve').length;
  const avgConfidence = completed.length
    ? completed.reduce((s, a) => s + (a.confidence_score ?? 0), 0) / completed.length
    : 0;
  const avgRevMid = completed.length
    ? completed.reduce((s, a) => {
        const [lo, hi] = a.monthly_revenue_range ?? [0, 0];
        return s + (lo + hi) / 2;
      }, 0) / completed.length
    : 0;

  // Sparkline values: SDI across completed assessments
  const sdiHistory = completed.slice(-8).map(a => (a.shelf_density_index ?? 0.5) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Assessment Dashboard</h1>
          <p className="text-sm text-muted mt-1">All kirana store credit assessments</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/how-it-works"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs text-muted hover:text-primary border border-border rounded-xl hover:bg-surface-2 transition-all"
          >
            <Cpu size={13} />
            How it works
          </Link>
          <Link
            to="/new-assessment"
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-all shadow-glow-accent"
          >
            <PlusCircle size={16} />
            New Assessment
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      {!isLoading && assessments && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard
            icon={Activity} label="Total assessments"
            animated rawValue={assessments.length} suffix=""
          />
          <StatCard
            icon={ShieldCheck} label="Approved" color="text-success"
            animated rawValue={approvals} suffix=""
          />
          <StatCard
            icon={BarChart2} label="Avg. confidence"
            animated rawValue={Math.round(avgConfidence * 100)} suffix="%"
          />
          <StatCard
            icon={IndianRupee} label="Avg. monthly revenue"
            value={formatLakh(avgRevMid)} sub="midpoint estimate"
          />
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {isLoading && (
        <div className="space-y-3 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="card p-8 text-center mb-8">
          <p className="text-sm text-danger mb-2">Failed to load assessments</p>
          <p className="text-xs text-muted mb-4">Make sure the backend is running and you're logged in.</p>
          <Link to="/results?demo=1" className="text-sm text-accent hover:underline">View demo results instead →</Link>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && assessments?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-accent" />
          </div>
          <h2 className="font-display text-lg font-bold text-primary mb-2">No assessments yet</h2>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            Start your first kirana store credit assessment. Upload images and get results in under 90 seconds.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/new-assessment" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-colors shadow-glow-accent">
              Start First Assessment
            </Link>
            <Link to="/results?demo=1" className="px-5 py-2.5 bg-surface-2 text-secondary rounded-xl text-sm font-semibold hover:bg-border transition-colors border border-border">
              View Demo
            </Link>
            <Link to="/how-it-works" className="px-5 py-2.5 bg-surface-2 text-secondary rounded-xl text-sm font-semibold hover:bg-border transition-colors border border-border">
              How it works
            </Link>
          </div>
        </div>
      )}

      {/* ── Assessments list ── */}
      {!isLoading && assessments && assessments.length > 0 && (
        <>
          {sdiHistory.length > 2 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest">Recent assessments</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">SDI trend</span>
                <Sparkline values={sdiHistory} color="#FF6B35" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {assessments.map((a, i) => (
              <Link
                key={a.assessment_id}
                to={`/results?id=${a.assessment_id}`}
                className={`card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all border-l-4 group animate-in ${borderColor(a.recommendation)}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex-shrink-0">
                  <StatusDot status={a.status} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary truncate">
                      {a.store_address ?? `Assessment ${a.assessment_id.slice(0, 8)}`}
                    </p>
                    {a.recommendation && (
                      <RecIcon rec={a.recommendation} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted">
                      {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {a.lat && (
                      <span className="flex items-center gap-0.5 text-xs text-muted">
                        <MapPin size={10} />
                        {a.lat.toFixed(3)}, {a.lng.toFixed(3)}
                      </span>
                    )}
                    {a.confidence_score && (
                      <span className="text-xs bg-surface-2 text-muted border border-border rounded px-1.5 py-0.5">
                        {Math.round(a.confidence_score * 100)}% conf
                      </span>
                    )}
                  </div>
                </div>

                {a.status === 'completed' && a.monthly_revenue_range && (
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-primary font-display metric-number">
                      {formatRangeLakh(a.monthly_revenue_range)}
                    </p>
                    <p className="text-xs text-muted">per month</p>
                  </div>
                )}

                {a.shelf_density_index && (
                  <div className="hidden md:flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{
                        borderColor: a.shelf_density_index > 0.7 ? '#1A7A4A' : a.shelf_density_index > 0.5 ? '#B45309' : '#DC2626',
                        color: a.shelf_density_index > 0.7 ? '#1A7A4A' : a.shelf_density_index > 0.5 ? '#B45309' : '#DC2626',
                      }}>
                      {Math.round(a.shelf_density_index * 100)}
                    </div>
                    <span className="text-[10px] text-muted mt-0.5">SDI</span>
                  </div>
                )}

                <ChevronRight size={16} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}

    </div>
  );
}