import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import type { AssessmentResult } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

function getConfidenceLabel(score: number) {
  if (score >= 0.75) return { label: 'High', color: '#1A7A4A', bg: '#ECFDF3' };
  if (score >= 0.55) return { label: 'Moderate', color: '#B45309', bg: '#FFFBEB' };
  return { label: 'Low', color: '#DC2626', bg: '#FEF2F2' };
}

export default function ConfidenceGauge({ data }: Props) {
  const score = data.confidence_score ?? 0;
  const pct = Math.round(score * 100);
  const { label, color, bg } = getConfidenceLabel(score);

  const chartData = [{ value: pct, fill: color }];

  return (
    <div className="card p-6 flex flex-col items-center justify-center">
      <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4 self-start">Confidence Score</p>

      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={12}
            data={chartData}
            startAngle={225}
            endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            {/* Background track */}
            <RadialBar
              background={{ fill: '#E4E2DD' }}
              dataKey="value"
              cornerRadius={6}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-primary metric-number">{pct}%</span>
          <span className="text-xs font-medium text-muted">{label}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 w-full space-y-1.5">
        <LegendRow color="#1A7A4A" label="High" range="75–100%" active={score >= 0.75} />
        <LegendRow color="#B45309" label="Moderate" range="55–74%" active={score >= 0.55 && score < 0.75} />
        <LegendRow color="#DC2626" label="Low" range="0–54%" active={score < 0.55} />
      </div>

      <div className="mt-4 w-full p-3 rounded-xl border text-xs text-center font-medium" style={{ background: bg, color, borderColor: color + '33' }}>
        Confidence based on signal quality &amp; fraud flags
      </div>
    </div>
  );
}

function LegendRow({ color, label, range, active }: { color: string; label: string; range: string; active: boolean }) {
  return (
    <div className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-all ${active ? 'bg-surface-2' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className={`font-medium ${active ? 'text-primary' : 'text-muted'}`}>{label}</span>
      </div>
      <span className={active ? 'text-secondary font-semibold' : 'text-muted'}>{range}</span>
    </div>
  );
}