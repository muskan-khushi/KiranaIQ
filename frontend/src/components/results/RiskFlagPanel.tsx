import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getSeverityConfig } from '../../utils/riskColors';
import type { AssessmentResult, RiskFlag } from '../../api/types';

interface Props {
  data: AssessmentResult;
}

export default function RiskFlagPanel({ data }: Props) {
  const flags = data.risk_flags ?? [];

  if (flags.length === 0) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[180px]">
        <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center">
          <ShieldCheck size={28} className="text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-primary">No Risk Flags Detected</h3>
          <p className="text-sm text-muted mt-1">All 5 cross-signal tripwires passed successfully.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mt-1">
          {['Inventory ✓', 'Consistency ✓', 'Coverage ✓', 'SKU-Geo ✓', 'Competition ✓'].map(t => (
            <span key={t} className="text-xs bg-success-light text-success border border-success/20 px-2 py-0.5 rounded-full font-medium">{t}</span>
          ))}
        </div>
      </div>
    );
  }

  const highCount = flags.filter(f => f.severity === 'high').length;
  const medCount = flags.filter(f => f.severity === 'medium').length;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Risk Flags</p>
        <div className="flex gap-2">
          {highCount > 0 && (
            <span className="text-xs font-bold bg-danger-light text-danger border border-danger/20 px-2 py-0.5 rounded-full">
              {highCount} High
            </span>
          )}
          {medCount > 0 && (
            <span className="text-xs font-bold bg-warning-light text-warning border border-warning/20 px-2 py-0.5 rounded-full">
              {medCount} Medium
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {flags.map((flag, idx) => (
          <FlagCard key={idx} flag={flag} defaultOpen={idx === 0} />
        ))}
      </div>
    </div>
  );
}

function FlagCard({ flag, defaultOpen }: { flag: RiskFlag; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = getSeverityConfig(flag.severity);

  const Icon = flag.severity === 'high' ? AlertTriangle : flag.severity === 'medium' ? AlertTriangle : Info;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${cfg.bg} ${cfg.border}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <Icon size={18} className={cfg.text} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary capitalize truncate">
              {flag.code.replace(/_/g, ' ')}
            </span>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border} flex-shrink-0`}>
              {flag.severity}
            </span>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-muted flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-black/5">
          <p className="text-sm text-secondary mt-3">{flag.description}</p>
          <div className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg border border-white/80">
            <span className="text-xs font-semibold text-muted uppercase mt-0.5 flex-shrink-0">Action:</span>
            <p className="text-xs font-medium text-primary">{flag.recommended_action}</p>
          </div>
        </div>
      )}
    </div>
  );
}