import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { MOCK_ASSESSMENT_RESULT } from '../../utils/mockData';

export default function RiskFlagPanel() {
  const flags = MOCK_ASSESSMENT_RESULT.risk_flags;

  if (flags.length === 0) {
    return (
      <div className="w-full h-full bg-success/5 border border-success/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <ShieldCheck className="text-success mb-3" size={40} />
        <h3 className="text-lg font-semibold text-primary">No Risk Flags Detected</h3>
        <p className="text-sm text-muted mt-1">Cross-signal validation passed all consistency checks.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Fraud & Risk Tripwires</h2>
      
      <div className="space-y-3">
        {flags.map((flag, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-xl border flex gap-3
              ${flag.severity === 'high' ? 'bg-danger/5 border-danger/20' : 
                flag.severity === 'medium' ? 'bg-warning/5 border-warning/20' : 
                'bg-primary/5 border-primary/10'}`}
          >
            <div className="mt-0.5">
              {flag.severity === 'high' ? <AlertTriangle className="text-danger" size={20} /> :
               flag.severity === 'medium' ? <AlertTriangle className="text-warning" size={20} /> :
               <Info className="text-primary" size={20} />}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-primary capitalize">
                  {flag.code.replace(/_/g, ' ')}
                </h4>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm
                  ${flag.severity === 'high' ? 'bg-danger/10 text-danger' : 
                    flag.severity === 'medium' ? 'bg-warning/10 text-warning' : 
                    'bg-primary/10 text-primary'}`}>
                  {flag.severity}
                </span>
              </div>
              <p className="text-sm text-muted mb-2">{flag.description}</p>
              <div className="bg-surface/50 rounded p-2 border border-border/50">
                <p className="text-xs font-medium text-primary">
                  <span className="text-muted mr-1">Action:</span> {flag.recommended_action}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}