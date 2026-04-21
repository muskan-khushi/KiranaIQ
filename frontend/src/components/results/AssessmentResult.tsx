import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAssessmentPoll } from '../../hooks/useAssessmentPoll';
import { MOCK_ASSESSMENT_RESULT } from '../../utils/mockData';
import ProgressTracker from '../assessment/ProgressTracker';
import CashFlowCard from './CashFlowCard';
import ConfidenceGauge from './ConfidenceGauge';
import RiskFlagPanel from './RiskFlagPanel';
import FeatureBreakdown from './FeatureBreakdown';
import PeerBenchmarkChart from './PeerBenchmarkChart';
import GeoMapView from './GeoMapView';
import LoanSuggestionBox from './LoanSuggestionBox';
import ExportPDFButton from './ExportPDFButton';
import type { AssessmentResult } from '../../api/types';

// Skeleton component for loading state
function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className ?? ''}`} />;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2"><Skeleton className="h-64" /></div>
        <Skeleton className="h-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function AssessmentResult() {
  const [params] = useSearchParams();
  const assessmentId = params.get('id');
  const demo = params.get('demo') === '1';

  const { status, result } = useAssessmentPoll(demo ? null : assessmentId);

  // Use demo data when no ID or demo flag
  const data: AssessmentResult | null = demo
    ? MOCK_ASSESSMENT_RESULT
    : result ?? null;

  const isProcessing = !demo && (!status || status.status === 'queued' || status.status === 'processing');
  const isFailed = !demo && status?.status === 'failed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <div className="w-px h-4 bg-border" />
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">Assessment Results</h1>
            {data?.store_address && (
              <p className="text-sm text-muted mt-0.5">{data.store_address}</p>
            )}
          </div>
        </div>
        {data && data.status === 'completed' && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted hidden md:block">
              {data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </span>
            <ExportPDFButton data={data} />
          </div>
        )}
      </div>

      {/* Processing state */}
      {isProcessing && status && (
        <div className="max-w-xl mx-auto animate-in">
          <ProgressTracker
            stages={status.pipeline_stages}
            overallStatus={status.status}
          />
          <p className="text-center text-sm text-muted mt-4">
            This page auto-updates every 3 seconds...
          </p>
        </div>
      )}

      {/* Initial loading (no status yet) */}
      {!demo && !status && assessmentId && (
        <div className="max-w-xl mx-auto flex flex-col items-center gap-4 py-16">
          <RefreshCw size={32} className="text-accent animate-spin-slow" />
          <p className="text-muted text-sm">Connecting to pipeline...</p>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="max-w-xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-display text-xl font-bold text-primary mb-2">Pipeline Failed</h2>
          <p className="text-muted text-sm mb-6">The assessment could not be completed. Please try again.</p>
          <Link to="/new-assessment" className="btn-primary">Start New Assessment</Link>
        </div>
      )}

      {/* Results */}
      {data && data.status === 'completed' && (
        <div className="space-y-6 animate-in">
          {/* Row 1: Cash flow (wide) + Confidence gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 animate-in stagger-1">
              <CashFlowCard data={data} />
            </div>
            <div className="animate-in stagger-2">
              <ConfidenceGauge data={data} />
            </div>
          </div>

          {/* Row 2: Risk flags + Feature attribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-in stagger-3">
              <RiskFlagPanel data={data} />
            </div>
            <div className="animate-in stagger-4">
              <FeatureBreakdown data={data} />
            </div>
          </div>

          {/* Row 3: Peer benchmark + Map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-in stagger-5">
              <PeerBenchmarkChart data={data} />
            </div>
            <div className="animate-in stagger-6">
              <GeoMapView lat={data.lat} lng={data.lng} storeName={data.store_address} />
            </div>
          </div>

          {/* Row 4: Loan suggestion (full width) */}
          <div className="animate-in" style={{ animationDelay: '360ms' }}>
            <LoanSuggestionBox data={data} />
          </div>

          {/* Pipeline summary */}
          <div className="card p-4 animate-in" style={{ animationDelay: '420ms' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Pipeline Stages</p>
            <div className="flex flex-wrap gap-2">
              {data.pipeline_stages.map(stage => (
                <div key={stage.stage} className="flex items-center gap-1.5 text-xs bg-success-light text-success border border-success/20 px-3 py-1.5 rounded-full font-medium">
                  <span>✓</span>
                  <span className="capitalize">{stage.stage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No ID and not demo */}
      {!assessmentId && !demo && (
        <div className="text-center py-16">
          <p className="text-muted text-sm mb-4">No assessment ID found.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/new-assessment" className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-colors">
              Start New Assessment
            </Link>
            <Link to="/results?demo=1" className="px-4 py-2 bg-surface-2 text-secondary rounded-xl text-sm font-semibold hover:bg-border transition-colors border border-border">
              View Demo Results
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}