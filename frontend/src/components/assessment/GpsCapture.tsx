import { useEffect } from 'react';
import { MapPin, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';

interface Props {
  onCapture: (lat: number, lng: number) => void;
}

export default function GpsCapture({ onCapture }: Props) {
  const { lat, lng, accuracy, error, loading, capture } = useGeolocation(true);

  // Notify parent via effect instead of during render to avoid
  // React StrictMode double-invocation and infinite re-render loops
  useEffect(() => {
    if (lat != null && lng != null) {
      onCapture(lat, lng);
    }
  }, [lat, lng, onCapture]);

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
      lat ? 'bg-success-light border-success/20' : error ? 'bg-danger-light border-danger/20' : 'bg-surface-2 border-border'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${lat ? 'bg-success/10 text-success' : error ? 'bg-danger/10 text-danger' : 'bg-surface text-muted'}`}>
          {loading ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">
            {loading ? 'Getting location...' : lat ? 'GPS Location Captured' : error ? 'Location Error' : 'Location Pending'}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {lat
              ? `${lat.toFixed(5)}, ${lng?.toFixed(5)} · Accuracy: ±${Math.round(accuracy ?? 0)}m`
              : error
                ? error
                : 'Tap to capture your GPS coordinates'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {lat && <CheckCircle2 size={18} className="text-success" />}
        {error && <AlertCircle size={18} className="text-danger" />}
        <button
          type="button"
          onClick={capture}
          disabled={loading}
          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface transition-all disabled:opacity-50"
          title="Recapture location"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}