import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AssessmentResult } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-xl shadow-elevated px-3 py-2 text-xs">
      <p className="font-semibold text-primary">{d.feature}</p>
      <p className="text-muted mt-0.5">Value: <span className="text-primary font-medium">{(d.value * 100).toFixed(0)}%</span></p>
      <p className="text-muted">Impact: <span className="font-medium" style={{ color: d.direction === 'positive' ? '#1A7A4A' : '#DC2626' }}>
        {d.direction === 'positive' ? '+' : '-'}{d.contribution_pct}%
      </span></p>
    </div>
  );
};

export default function FeatureBreakdown({ data }: Props) {
  const attribution = data.feature_attribution ?? [];
  if (!attribution.length) return null;

  const chartData = attribution.map(a => ({
    feature: a.feature.replace(' Index', '').replace(' Score', '').replace(' Est', ''),
    contribution: a.contribution_pct,
    value: a.value,
    direction: a.direction,
  })).slice(0, 7);

  return (
    <div className="card p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">Estimate Drivers</p>
        <p className="text-sm text-secondary">Which signals contributed most to the revenue estimate</p>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            barSize={18}
          >
            <XAxis type="number" hide domain={[0, 30]} />
            <YAxis
              dataKey="feature"
              type="category"
              axisLine={false}
              tickLine={false}
              width={110}
              tick={{ fontSize: 11, fill: '#7A7670', fontFamily: 'DM Sans, sans-serif' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }} />
            <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.direction === 'positive' ? '#1A7A4A' : '#DC2626'}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <div className="w-3 h-3 rounded-sm bg-success opacity-85" />
          Revenue-boosting
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <div className="w-3 h-3 rounded-sm bg-danger opacity-85" />
          Revenue-suppressing
        </div>
      </div>
    </div>
  );
}