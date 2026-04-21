import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart2, IndianRupee } from 'lucide-react';
import { listAssessments } from '../api/assessment.api';
import { formatLakh, formatPercent } from '../utils/formatCurrency';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { AssessmentResult } from '../api/types';

const REC_COLORS: Record<string, string> = {
  approve: '#1A7A4A',
  needs_verification: '#B45309',
  reject: '#DC2626',
};

export default function Analytics() {
  const { data: assessments = [], isLoading } = useQuery<AssessmentResult[]>({
    queryKey: ['assessments'],
    queryFn: () => listAssessments(),
    staleTime: 30_000,
  });

  const completed = assessments.filter(a => a.status === 'completed');

  // ── Derived metrics ───────────────────────────────────────────────────────
  const totalAssessments = assessments.length;
  const completedCount   = completed.length;
  const approveCount     = completed.filter(a => a.recommendation === 'approve').length;
  const rejectCount      = completed.filter(a => a.recommendation === 'reject').length;
  const verifyCount      = completed.filter(a => a.recommendation === 'needs_verification').length;
  const approvalRate     = completedCount ? approveCount / completedCount : 0;
  const avgConfidence    = completedCount
    ? completed.reduce((s, a) => s + (a.confidence_score ?? 0), 0) / completedCount
    : 0;
  const avgMonthlyRevenueMid = completedCount
    ? completed.reduce((s, a) => {
        const [lo, hi] = a.monthly_revenue_range ?? [0, 0];
        return s + (lo + hi) / 2;
      }, 0) / completedCount
    : 0;
  const totalFlagged = completed.filter(a => (a.risk_flags?.length ?? 0) > 0).length;

  // ── Chart data ────────────────────────────────────────────────────────────
  const pieData = [
    { name: 'Approve', value: approveCount, color: REC_COLORS.approve },
    { name: 'Verify', value: verifyCount, color: REC_COLORS.needs_verification },
    { name: 'Reject', value: rejectCount, color: REC_COLORS.reject },
  ].filter(d => d.value > 0);

  // Revenue distribution buckets
  const buckets = ['0–3L', '3–6L', '6–10L', '10L+'];
  const bucketData = buckets.map(label => {
    let [lo, hi]: [number, number] = [0, Infinity];
    if (label === '0–3L')  { lo = 0;        hi = 300_000; }
    if (label === '3–6L')  { lo = 300_000;  hi = 600_000; }
    if (label === '6–10L') { lo = 600_000;  hi = 1_000_000; }
    if (label === '10L+')  { lo = 1_000_000; hi = Infinity; }
    const count = completed.filter(a => {
      const mid = ((a.monthly_revenue_range?.[0] ?? 0) + (a.monthly_revenue_range?.[1] ?? 0)) / 2;
      return mid >= lo && mid < hi;
    }).length;
    return { label, count };
  });

  // Confidence histogram
  const confBins = ['0–40%', '40–60%', '60–75%', '75–100%'];
  const confData = confBins.map(bin => {
    let [lo, hi]: [number, number] = [0, 1];
    if (bin === '0–40%')   { lo = 0;    hi = 0.4; }
    if (bin === '40–60%')  { lo = 0.4;  hi = 0.6; }
    if (bin === '60–75%')  { lo = 0.6;  hi = 0.75; }
    if (bin === '75–100%') { lo = 0.75; hi = 1.01; }
    const count = completed.filter(a => {
      const c = a.confidence_score ?? 0;
      return c >= lo && c < hi;
    }).length;
    return { label: bin, count };
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-primary">Portfolio Analytics</h1>
        <p className="text-sm text-muted mt-1">Aggregate insights across all kirana assessments</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Total Assessments"
          value={String(totalAssessments)}
          icon={<Activity size={18} />}
        />
        <KPICard
          label="Approval Rate"
          value={formatPercent(approvalRate)}
          sub={`${approveCount} of ${completedCount} completed`}
          icon={<TrendingUp size={18} className="text-success" />}
          valueColor="text-success"
        />
        <KPICard
          label="Avg Confidence"
          value={formatPercent(avgConfidence)}
          icon={<BarChart2 size={18} />}
        />
        <KPICard
          label="Avg Monthly Revenue"
          value={formatLakh(avgMonthlyRevenueMid)}
          sub="midpoint estimate"
          icon={<IndianRupee size={18} />}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">Risk-Flagged</p>
          <p className="font-display text-3xl font-bold text-warning metric-number">{totalFlagged}</p>
          <p className="text-xs text-muted">{completedCount ? formatPercent(totalFlagged / completedCount) : '—'} of completed</p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">Needs Verification</p>
          <p className="font-display text-3xl font-bold text-warning metric-number">{verifyCount}</p>
          <p className="text-xs text-muted">require follow-up</p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">Rejected</p>
          <p className="font-display text-3xl font-bold text-danger metric-number">{rejectCount}</p>
          <p className="text-xs text-muted">high-risk stores</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Recommendation distribution */}
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Recommendation Breakdown</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span className="text-xs text-secondary">{value}</span>}
                />
                <Tooltip formatter={(value) => [value, 'Stores']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No completed assessments yet" />
          )}
        </div>

        {/* Revenue distribution */}
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Monthly Revenue Distribution</p>
          {completedCount > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bucketData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7A7670' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A7670' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Stores']} />
                <Bar dataKey="count" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No completed assessments yet" />
          )}
        </div>

        {/* Confidence distribution */}
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Confidence Score Distribution</p>
          {completedCount > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={confData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7A7670' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A7670' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Stores']} />
                <Bar dataKey="count" fill="#1A7A4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No completed assessments yet" />
          )}
        </div>

        {/* Summary card */}
        <div className="card p-6 flex flex-col gap-3 justify-center">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest">Quick Stats</p>
          <StatRow label="Completed" value={`${completedCount} / ${totalAssessments}`} />
          <StatRow label="Approval Rate" value={formatPercent(approvalRate)} color="text-success" />
          <StatRow label="Avg Confidence" value={formatPercent(avgConfidence)} />
          <StatRow label="Risk-Flagged Rate" value={completedCount ? formatPercent(totalFlagged / completedCount) : '—'} color="text-warning" />
          <StatRow label="Rejection Rate" value={completedCount ? formatPercent(rejectCount / completedCount) : '—'} color="text-danger" />
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label, value, sub, icon, valueColor = 'text-primary',
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode; valueColor?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted font-medium">{label}</p>
        <span className="text-muted">{icon}</span>
      </div>
      <p className={`font-display text-2xl font-bold metric-number ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value, color = 'text-primary' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold metric-number ${color}`}>{value}</span>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}