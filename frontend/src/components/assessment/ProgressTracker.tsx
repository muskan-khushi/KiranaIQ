import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

// Mocking the 5 pipeline stages defined in your architecture
const STAGES = [
  { id: 'vision', label: 'Vision Intelligence', description: 'Extracting shelf density & SKUs' },
  { id: 'geo', label: 'Geo-Spatial Analysis', description: 'Mapping footfall & competition' },
  { id: 'fraud', label: 'Fraud Detection', description: 'Running cross-signal tripwires' },
  { id: 'fusion', label: 'Multimodal Fusion', description: 'Computing working capital cycle' },
  { id: 'loan', label: 'Loan Sizing Engine', description: 'Calculating FOIR & EMI limits' },
];

interface Props {
  // We'll pass the current active stage index (0 to 4), or 5 if completed
  currentStageIndex: number; 
}

export default function ProgressTracker({ currentStageIndex }: Props) {
  return (
    <div className="w-full bg-surface border border-border rounded-2xl p-6 shadow-aesthetic">
      <h2 className="text-lg font-bold text-primary mb-6">Analyzing Store Intelligence...</h2>
      
      <div className="space-y-6">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isActive = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div key={stage.id} className="flex items-start gap-4 relative">
              {/* Connector Line */}
              {index !== STAGES.length - 1 && (
                <div className={clsx(
                  "absolute left-[11px] top-8 w-[2px] h-[calc(100%-8px)]",
                  isCompleted ? "bg-success" : "bg-border"
                )} />
              )}

              {/* Status Icon */}
              <div className="relative z-10 bg-surface">
                {isCompleted && <CheckCircle2 className="text-success" size={24} />}
                {isActive && <Loader2 className="text-primary animate-spin" size={24} />}
                {isPending && <Circle className="text-border" size={24} />}
              </div>

              {/* Text Content */}
              <div className={clsx(
                "flex-1 -mt-1",
                isPending && "opacity-50"
              )}>
                <h3 className={clsx(
                  "text-sm font-semibold uppercase tracking-wider",
                  isActive ? "text-primary" : "text-muted"
                )}>
                  {stage.label}
                </h3>
                <p className="text-sm text-muted mt-1">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}