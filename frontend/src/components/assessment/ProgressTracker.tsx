import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import type { PipelineStage, StageStatus } from '../../api/types';

const STAGE_META: Record<string, { label: string; description: string; emoji: string }> = {
  vision: { label: 'Vision Intelligence', description: 'Analysing shelf density, SKUs & product categories', emoji: '👁' },
  geo: { label: 'Geo-Spatial Analysis', description: 'Scoring footfall, competition & catchment area', emoji: '📍' },
  fraud: { label: 'Fraud Detection', description: 'Running 5 cross-signal tripwire validators', emoji: '🛡' },
  fusion: { label: 'Multimodal Fusion', description: 'Computing working capital cycle & revenue ranges', emoji: '⚡' },
  loan: { label: 'Loan Sizing Engine', description: 'FOIR-based loan recommendation & peer benchmarking', emoji: '🏦' },
};

const STAGE_ORDER = ['vision', 'geo', 'fraud', 'fusion', 'loan'];

interface Props {
  stages: PipelineStage[];
  overallStatus?: string;
}

export default function ProgressTracker({ stages, overallStatus }: Props) {
  const stageMap: Record<string, StageStatus> = {};
  stages.forEach(s => { stageMap[s.stage] = s.status; });

  const doneCount = stages.filter(s => s.status === 'done').length;
  const progress = Math.round((doneCount / 5) * 100);

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-semibold text-lg text-primary">Analysing Store Intelligence</h2>
          <p className="text-sm text-muted mt-0.5">AI pipeline running — this takes 30–60 seconds</p>
        </div>
        <div className="text-right">
          <span className="font-display text-2xl font-bold text-accent">{progress}%</span>
          <p className="text-xs text-muted">complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stages */}
      <div className="space-y-0">
        {STAGE_ORDER.map((stageId, idx) => {
          const status = stageMap[stageId] ?? 'pending';
          const meta = STAGE_META[stageId];
          const isLast = idx === STAGE_ORDER.length - 1;

          return (
            <div key={stageId} className="relative flex gap-4">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-[15px] top-8 bottom-0 w-0.5 transition-colors duration-500 ${
                    status === 'done' ? 'bg-success' : 'bg-border'
                  }`}
                  style={{ height: 'calc(100% - 8px)' }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 w-8 h-8 mt-1 flex-shrink-0 bg-surface flex items-center justify-center">
                {status === 'done' && <CheckCircle2 size={28} className="text-success" />}
                {status === 'running' && (
                  <div className="relative">
                    <Loader2 size={28} className="text-accent animate-spin" />
                    <div className="absolute inset-0 rounded-full bg-accent/10 animate-ping" />
                  </div>
                )}
                {status === 'failed' && <XCircle size={28} className="text-danger" />}
                {status === 'pending' && <Circle size={28} className="text-border" />}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-6 transition-opacity duration-300 ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.emoji}</span>
                  <h3 className={`text-sm font-semibold tracking-wide ${
                    status === 'running' ? 'text-accent' : status === 'done' ? 'text-primary' : 'text-muted'
                  }`}>
                    {meta.label}
                  </h3>
                  {status === 'running' && (
                    <span className="text-[10px] font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full animate-pulse">
                      Running
                    </span>
                  )}
                  {status === 'done' && (
                    <span className="text-[10px] font-medium bg-success-light text-success px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">{meta.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {overallStatus === 'failed' && (
        <div className="mt-2 p-3 bg-danger-light border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2">
          <XCircle size={16} />
          Pipeline failed. Please retry or contact support.
        </div>
      )}
    </div>
  );
}