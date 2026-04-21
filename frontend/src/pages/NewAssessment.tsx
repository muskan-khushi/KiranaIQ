import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MapPin, Store, Calendar, IndianRupee, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import ImageUploadZone from '../assessment/ImageUploadZone';
import GpsCapture from '../assessment/GpsCapture';
import { submitAssessment } from '../../api/assessment.api';

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
    onSuccess: (data) => {
      navigate(`/results?id=${data.assessment_id}`);
    },
  });

  const canSubmit = images.length >= 3 && coords;

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
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20 mb-3">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          AI-Powered Underwriting
        </div>
        <h1 className="font-display text-3xl font-bold text-primary mb-2">New Store Assessment</h1>
        <p className="text-muted">Upload 3–5 store images and GPS location. Our AI will return a credit report in under 90 seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Images */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-accent text-white rounded-lg flex items-center justify-center font-display font-bold text-sm">1</div>
            <div>
              <h2 className="font-semibold text-primary">Visual Intelligence</h2>
              <p className="text-xs text-muted">Interior shelves, counter, exterior — minimum 3 photos</p>
            </div>
          </div>
          <ImageUploadZone onImagesChange={setImages} />
        </div>

        {/* Step 2: GPS */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-accent text-white rounded-lg flex items-center justify-center font-display font-bold text-sm">2</div>
            <div>
              <h2 className="font-semibold text-primary">GPS Location</h2>
              <p className="text-xs text-muted">Required for geo-spatial footfall & competition analysis</p>
            </div>
          </div>
          <GpsCapture onCapture={handleCoords} />
        </div>

        {/* Step 3: Metadata */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-surface-2 text-secondary border border-border rounded-lg flex items-center justify-center font-display font-bold text-sm">3</div>
            <div>
              <h2 className="font-semibold text-primary">Store Metadata</h2>
              <p className="text-xs text-muted">Optional — each field adds ±5% accuracy to the estimate</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Address */}
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

        {/* Validation errors */}
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

        {/* Demo link */}
        <p className="text-center text-xs text-muted">
          Don't have images?{' '}
          <a href="/results?demo=1" className="text-accent hover:underline font-medium">
            View a demo assessment →
          </a>
        </p>
      </form>
    </div>
  );
}