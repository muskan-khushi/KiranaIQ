import { Users } from 'lucide-react';
import type { AssessmentResult } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

export default function PeerBenchmarkChart({ data }: Props) {
  const peer = data.peer_benchmark;

  if (!peer || peer.n_peers === 0) {
    return (
      <div className="card p-6">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Peer Benchmark</p>
        <div className="flex items-center gap-3 py-4 text-muted">
          <Users size={20} />
          <p className="text-sm">No comparable stores found within 2km. This is a new coverage area.</p>
        </div>
      </div>
    );
  }

  const pct = peer.percentile;
  const label = pct >= 75 ? 'Top Performer' : pct >= 50 ? 'Above Average' : pct >= 25 ? 'Below Average' : 'Low Performer';
  const color = pct >= 75 ? '#1A7A4A' : pct >= 50 ? '#FF6B35' : pct >= 25 ? '#B45309' : '#DC2626';

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Peer Benchmark</p>
        <span className="text-xs text-muted font-medium">{peer.n_peers} stores within 2km</span>
      </div>

      {/* Percentile gauge */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-2">
          <span className="font-display text-3xl font-bold metric-number" style={{ color }}>
            {pct.toFixed(0)}th
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded-full border text-white text-center" style={{ background: color }}>
            {label}
          </span>
        </div>
        <p className="text-sm text-muted mb-3">Percentile rank by Shelf Density Index vs. nearby stores</p>

        {/* Visual bar */}
        <div className="relative h-5 bg-surface-2 rounded-full overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
          />
          {/* Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-card"
            style={{ left: `${pct}%`, background: color }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>Bottom 25%</span><span>Median</span><span>Top 25%</span>
        </div>
      </div>

      {/* Comparison metrics */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <CompareRow
          label="Your Shelf Density"
          yours={data.shelf_density_index ?? 0}
          avg={peer.avg_sdi}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <CompareRow
          label="Your Footfall Score"
          yours={data.geo_footfall_score ?? 0}
          avg={peer.avg_footfall}
          format={(v) => `${Math.round(v)}`}
        />
      </div>
    </div>
  );
}

function CompareRow({ label, yours, avg, format }: {
  label: string; yours: number; avg: number; format: (v: number) => string;
}) {
  const better = yours >= avg;
  return (
    <div className="bg-surface-2 rounded-xl p-3 border border-border">
      <p className="text-xs text-muted mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="font-display font-bold text-base text-primary metric-number">{format(yours)}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${better ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
          {better ? '▲' : '▼'} avg {format(avg)}
        </span>
      </div>
    </div>
  );
}