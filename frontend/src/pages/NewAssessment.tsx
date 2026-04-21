import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  MapPin, Store, Calendar, IndianRupee, ChevronRight,
  AlertCircle, Loader2, CheckCircle2, Eye
} from 'lucide-react';
import ImageUploadZone from '../components/assessment/ImageUploadZone';
import GpsCapture from '../components/assessment/GpsCapture';
import { submitAssessment } from '../api/assessment.api';

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepBar({ steps }: { steps: { label: string; done: boolean; active: boolean }[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s.done ? 'bg-success text-white' : s.active ? 'bg-accent text-white' : 'bg-surface-2 text-muted border border-border'
            }`}>
              {s.done ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap transition-colors ${
              s.active ? 'text-accent' : s.done ? 'text-success' : 'text-muted'
            }`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${s.done ? 'bg-success' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Live accuracy estimator ─────────────────────────────────────────────────

function AccuracyMeter({ imageCount, hasGps, hasMeta }: { imageCount: number; hasGps: boolean; hasMeta: boolean }) {
  const score = Math.min(
    100,
    imageCount * 12 +
    (hasGps ? 25 : 0) +
    (hasMeta ? 15 : 0)
  );
  const label = score >= 80 ? 'High' : score >= 60 ? 'Moderate' : score >= 40 ? 'Fair' : 'Low';
  const color = score >= 80 ? '#1A7A4A' : score >= 60 ? '#2563EB' : score >= 40 ? '#B45309' : '#9CA3AF';

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted">Estimated accuracy</span>
        <span className="text-xs font-bold" style={{ color }}>{label} ({score}%)</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {[
          { label: 'GPS location', done: hasGps, gain: '+25%' },
          { label: '3+ images', done: imageCount >= 3, gain: '+36%' },
          { label: 'Store metadata', done: hasMeta, gain: '+15%' },
        ].map(t => (
          <div key={t.label} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
            t.done
              ? 'bg-success-light text-success border-success/20'
              : 'bg-surface text-muted border-border'
          }`}>
            {t.done ? <CheckCircle2 size={10} /> : <span className="text-muted text-[10px]">{t.gain}</span>}
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function NewAssessment() {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [meta, setMeta] = useState({
    store_address: '',
    shop_size_sqft: '',
    years_in_operation: '',
    monthly_rent: '',
  });

  const handleCoords = useCallback((lat: number, lng: number) => {
    setCoords(c => (c?.lat === lat && c?.lng === lng) ? c : { lat, lng });
  }, []);

  const mutation = useMutation({
    mutationFn: (fd: FormData) => submitAssessment(fd),
    onSuccess: (data: { assessment_id: string }) => {
      navigate(`/results?id=${data.assessment_id}`);
    },
  });

  const hasMeta = !!(meta.shop_size_sqft || meta.years_in_operation || meta.monthly_rent || meta.store_address);
  const canSubmit = images.length >= 3 && !!coords;

  const steps = [
    { label: 'Images', done: images.length >= 3, active: images.length < 3 },
    { label: 'GPS', done: !!coords, active: images.length >= 3 && !coords },
    { label: 'Details', done: hasMeta, active: images.length >= 3 && !!coords && !hasMeta },
    { label: 'Submit', done: false, active: canSubmit },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || mutation.isPending) return;

    const fd = new FormData();
    images.forEach(img => fd.append('images', img));
    fd.append('lat', String(coords!.lat));
    fd.append('lng', String(coords!.lng));
    if (meta.store_address) fd.append('store_address', meta.store_address);
    if (meta.shop_size_sqft) fd.append('shop_size_sqft', meta.shop_size_sqft);
    if (meta.years_in_operation) fd.append('years_in_operation', meta.years_in_operation);
    if (meta.monthly_rent) fd.append('monthly_rent', meta.monthly_rent);

    mutation.mutate(fd);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20 mb-3">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          AI-Powered Underwriting
        </div>
        <h1 className="font-display text-3xl font-bold text-primary mb-2">New Store Assessment</h1>
        <p className="text-muted">Upload 3–5 store images and GPS location. Results in under 90 seconds.</p>
      </div>

      {/* Step bar */}
      <StepBar steps={steps} />

      {/* Accuracy meter */}
      <AccuracyMeter
        imageCount={images.length}
        hasGps={!!coords}
        hasMeta={hasMeta}
      />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Step 1: Images */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm transition-colors ${
              images.length >= 3 ? 'bg-success text-white' : 'bg-accent text-white'
            }`}>
              {images.length >= 3 ? <CheckCircle2 size={16} /> : '1'}
            </div>
            <div>
              <h2 className="font-semibold text-primary">Visual Intelligence</h2>
              <p className="text-xs text-muted">Interior shelves, counter, exterior — minimum 3 photos</p>
            </div>
            {images.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium border ${
                images.length >= 3
                  ? 'bg-success-light text-success border-success/20'
                  : 'bg-warning-light text-warning border-warning/20'
              }`}>
                {images.length}/5 photos
              </span>
            )}
          </div>
          <ImageUploadZone onImagesChange={setImages} />
        </div>

        {/* Step 2: GPS */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm transition-colors ${
              coords ? 'bg-success text-white' : 'bg-surface-2 text-secondary border border-border'
            }`}>
              {coords ? <CheckCircle2 size={16} /> : '2'}
            </div>
            <div>
              <h2 className="font-semibold text-primary">GPS Location</h2>
              <p className="text-xs text-muted">Required for geo-spatial footfall and competition analysis</p>
            </div>
          </div>
          <GpsCapture onCapture={handleCoords} />
        </div>

        {/* Step 3: Metadata */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm transition-colors ${
              hasMeta ? 'bg-success text-white' : 'bg-surface-2 text-secondary border border-border'
            }`}>
              {hasMeta ? <CheckCircle2 size={16} /> : '3'}
            </div>
            <div>
              <h2 className="font-semibold text-primary">Store Metadata</h2>
              <p className="text-xs text-muted">Optional — each field adds ±5% accuracy to the estimate</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Store address (optional)"
                value={meta.store_address}
                onChange={e => setMeta(m => ({ ...m, store_address: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-primary placeholder:text-muted"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="number"
                  placeholder="Size (sq.ft)"
                  value={meta.shop_size_sqft}
                  onChange={e => setMeta(m => ({ ...m, shop_size_sqft: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-primary placeholder:text-muted"
                />
              </div>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="number"
                  placeholder="Years operating"
                  value={meta.years_in_operation}
                  onChange={e => setMeta(m => ({ ...m, years_in_operation: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-primary placeholder:text-muted"
                />
              </div>
              <div className="relative">
                <IndianRupee size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="number"
                  placeholder="Monthly rent"
                  value={meta.monthly_rent}
                  onChange={e => setMeta(m => ({ ...m, monthly_rent: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-primary placeholder:text-muted"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Validation */}
        {!canSubmit && images.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-warning bg-warning-light border border-warning/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {images.length < 3
              ? `Add ${3 - images.length} more image${3 - images.length > 1 ? 's' : ''} to proceed`
              : 'Waiting for GPS location...'}
          </div>
        )}

        {/* API error */}
        {mutation.isError && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger-light border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {(mutation.error as any)?.response?.data?.detail ?? 'Submission failed. Please try again.'}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || mutation.isPending}
          className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-base transition-all ${
            canSubmit && !mutation.isPending
              ? 'bg-accent text-white hover:bg-accent-dark shadow-glow-accent hover:shadow-elevated'
              : 'bg-surface-2 text-muted cursor-not-allowed border border-border'
          }`}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Submitting to pipeline...
            </>
          ) : (
            <>
              Run Assessment Pipeline
              <ChevronRight size={20} />
            </>
          )}
        </button>

        {/* Demo + how-it-works links */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted">
          <a href="/results?demo=1" className="text-accent hover:underline font-medium">
            View demo results →
          </a>
          <span>·</span>
          <a href="/how-it-works" className="hover:text-primary transition-colors flex items-center gap-1">
            <Eye size={11} />
            How the AI pipeline works
          </a>
        </div>

      </form>
    </div>
  );
}