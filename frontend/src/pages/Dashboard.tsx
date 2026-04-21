import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react';
import { listAssessments } from '../api/assessment.api';
import { formatRangeLakh, formatPercent } from '../utils/formatCurrency';
import type { AssessmentResult, Recommendation } from '../api/types';

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

function recBg(rec?: Recommendation) {
  if (rec === 'approve') return 'border-l-success';
  if (rec === 'reject') return 'border-l-danger';
  return 'border-l-warning';
}

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Assessment Dashboard</h1>
          <p className="text-sm text-muted mt-1">All kirana store credit assessments</p>
        </div>
        <Link
          to="/new-assessment"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-all shadow-glow-accent"
        >
          <PlusCircle size={16} />
          New Assessment
        </Link>
      </div>

      {/* Stats row */}
      {!isLoading && assessments && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Assessments" value={assessments.length} />
          <StatCard label="Completed" value={completed.length} />
          <StatCard label="Approvals" value={approvals} color="success" />
          <StatCard label="Avg. Confidence" value={`${Math.round(avgConfidence * 100)}%`} />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card p-8 text-center">
          <p className="text-sm text-danger mb-2">Failed to load assessments</p>
          <p className="text-xs text-muted">Make sure the backend is running and you're logged in.</p>
          <Link to="/results?demo=1" className="inline-block mt-4 text-sm text-accent hover:underline">
            View demo results instead →
          </Link>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && assessments?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-accent" />
          </div>
          <h2 className="font-display text-lg font-bold text-primary mb-2">No assessments yet</h2>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            Start your first kirana store credit assessment. Upload images and get results in under 90 seconds.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/new-assessment" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-colors shadow-glow-accent">
              Start First Assessment
            </Link>
            <Link to="/results?demo=1" className="px-5 py-2.5 bg-surface-2 text-secondary rounded-xl text-sm font-semibold hover:bg-border transition-colors border border-border">
              View Demo
            </Link>
          </div>
        </div>
      )}

      {/* Assessments list */}
      {!isLoading && assessments && assessments.length > 0 && (
        <div className="space-y-3">
          {assessments.map((a, i) => (
            <Link
              key={a.assessment_id}
              to={`/results?id=${a.assessment_id}`}
              className={`card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all border-l-4 group animate-in ${recBg(a.recommendation)}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Status */}
              <div className="flex-shrink-0">
                <StatusDot status={a.status} />
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-primary truncate">
                    {a.store_address ?? `Assessment ${a.assessment_id.slice(0, 8)}`}
                  </p>
                  {a.recommendation && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <RecIcon rec={a.recommendation} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {a.lat && ` · ${a.lat.toFixed(3)}, ${a.lng.toFixed(3)}`}
                </p>
              </div>

              {/* Metrics */}
              {a.status === 'completed' && a.monthly_revenue_range && (
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-primary font-display metric-number">
                    {formatRangeLakh(a.monthly_revenue_range)}
                  </p>
                  <p className="text-xs text-muted">
                    {a.confidence_score ? `${formatPercent(a.confidence_score)} confidence` : 'Monthly'}
                  </p>
                </div>
              )}

              <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: 'success' }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted font-medium mb-1">{label}</p>
      <p className={`font-display text-2xl font-bold metric-number ${color === 'success' ? 'text-success' : 'text-primary'}`}>
        {value}
      </p>
    </div>
  );
}