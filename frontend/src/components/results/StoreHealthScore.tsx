import { useMemo } from 'react';
import type { AssessmentResult } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

function getHealthLabel(score: number): { label: string; sublabel: string; color: string; bg: string; border: string } {
  if (score >= 80) return { label: 'Excellent', sublabel: 'Strong candidate — all key signals positive', color: '#1A7A4A', bg: '#ECFDF3', border: '#BBF7D0' };
  if (score >= 65) return { label: 'Good', sublabel: 'Above-average store with minor concerns', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
  if (score >= 50) return { label: 'Fair', sublabel: 'Some signals are weak — review carefully', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' };
  if (score >= 35) return { label: 'Weak', sublabel: 'Multiple risk indicators present', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
  return { label: 'Poor', sublabel: 'High-risk profile — consider rejection', color: '#7F1D1D', bg: '#FEF2F2', border: '#FECACA' };
}

export default function StoreHealthScore({ data }: Props) {
  const score = useMemo(() => {
    const sdi = (data.shelf_density_index ?? 0.5) * 35;
    const footfall = ((data.geo_footfall_score ?? 50) / 100) * 25;
    const conf = (data.confidence_score ?? 0.5) * 25;
    const comp = (1 - (data.competition_index ?? 0.4)) * 15;
    return Math.round(sdi + footfall + conf + comp);
  }, [data]);

  const { label, sublabel, color, bg, border } = getHealthLabel(score);

  // SVG arc calculation
  const R = 52;
  const cx = 70;
  const cy = 70;
  const startAngle = -210;
  const endAngle = 30;
  const totalDeg = endAngle - startAngle;
  const scoreDeg = (score / 100) * totalDeg;

  function polarToXY(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(a1: number, a2: number, r: number) {
    const s = polarToXY(a1, r);
    const e = polarToXY(a2, r);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const recConfig = {
    approve: { label: 'Approve', bg: '#ECFDF3', text: '#1A7A4A', border: '#BBF7D0' },
    needs_verification: { label: 'Needs Verification', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    reject: { label: 'Reject', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  };
  const rec = data.recommendation ? recConfig[data.recommendation] : recConfig.needs_verification;

  return (
    <div className="card p-6" style={{ background: bg, borderColor: border }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest">Store Health Score</p>
          <p className="text-xs text-muted mt-0.5 max-w-xs">{sublabel}</p>
        </div>
        <div
          className="text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5"
          style={{ background: rec.bg, color: rec.text, borderColor: rec.border }}
        >
          {data.recommendation === 'approve' && <span>✓</span>}
          {data.recommendation === 'reject' && <span>✕</span>}
          {data.recommendation === 'needs_verification' && <span>!</span>}
          {rec.label}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge SVG */}
        <div className="flex-shrink-0">
          <svg width="140" height="100" viewBox="0 0 140 100">
            {/* Track */}
            <path
              d={arc(startAngle, endAngle, R)}
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Fill */}
            <path
              d={arc(startAngle, startAngle + scoreDeg, R)}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              style={{
                strokeDasharray: '1000',
                strokeDashoffset: '0',
                transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
            {/* Score text */}
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="22"
              fontWeight="700"
              fill={color}
              fontFamily="Syne, sans-serif"
            >
              {score}
            </text>
            <text
              x={cx}
              y={cy + 20}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fill={color}
              opacity="0.7"
              fontFamily="DM Sans, sans-serif"
            >
              / 100
            </text>
            {/* Label */}
            <text
              x={cx}
              y={cy + 32}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="600"
              fill={color}
              fontFamily="Syne, sans-serif"
            >
              {label}
            </text>
          </svg>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 space-y-2.5">
          {[
            { label: 'Shelf Density', value: data.shelf_density_index ?? 0.5, pct: Math.round((data.shelf_density_index ?? 0.5) * 100), weight: '35pts' },
            { label: 'Footfall Score', value: (data.geo_footfall_score ?? 50) / 100, pct: Math.round(data.geo_footfall_score ?? 50), weight: '25pts' },
            { label: 'Confidence', value: data.confidence_score ?? 0.5, pct: Math.round((data.confidence_score ?? 0.5) * 100), weight: '25pts' },
            { label: 'Low Competition', value: 1 - (data.competition_index ?? 0.4), pct: Math.round((1 - (data.competition_index ?? 0.4)) * 100), weight: '15pts' },
          ].map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-muted">{b.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-primary">{b.pct}%</span>
                  <span className="text-[10px] text-muted">{b.weight}</span>
                </div>
              </div>
              <div className="h-1.5 bg-black/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${b.pct}%`, background: color, transitionDelay: '200ms' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}