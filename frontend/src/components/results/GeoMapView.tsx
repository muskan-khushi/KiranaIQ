import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { Store, AlertCircle, MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  lat?: number | null;
  lng?: number | null;
  storeName?: string;
}

// Default: Chandni Chowk, Delhi — the demo store location
const DEFAULT_LAT = 28.6562;
const DEFAULT_LNG = 77.2310;

export default function GeoMapView({ lat, lng, storeName }: Props) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const safeLat = (lat != null && isFinite(lat)) ? lat : DEFAULT_LAT;
  const safeLng = (lng != null && isFinite(lng)) ? lng : DEFAULT_LNG;
  const hasRealCoords = lat != null && lng != null && isFinite(lat) && isFinite(lng);

  const [viewState, setViewState] = useState({
    longitude: safeLng,
    latitude: safeLat,
    zoom: 15,
  });

  // Update view if props change (e.g. async load)
  useEffect(() => {
    if (hasRealCoords) {
      setViewState(prev => ({
        ...prev,
        longitude: safeLng,
        latitude: safeLat,
      }));
    }
  }, [safeLat, safeLng, hasRealCoords]);

  if (!token) {
    return (
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest">Store Location</p>
        </div>
        <div className="min-h-[200px] bg-surface-2 flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="w-12 h-12 bg-warning-light rounded-full flex items-center justify-center">
            <AlertCircle size={24} className="text-warning" />
          </div>
          <div>
            <p className="font-semibold text-primary text-sm">Mapbox Token Required</p>
            <p className="text-xs text-muted mt-1">
              Add <code className="font-mono text-accent bg-accent/10 px-1 rounded">VITE_MAPBOX_TOKEN</code> to your .env file
            </p>
          </div>
          {hasRealCoords && (
            <div className="bg-surface border border-border rounded-xl px-4 py-2 text-xs font-mono text-muted flex items-center gap-1.5">
              <MapPin size={12} />
              {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Store Location</p>
        <span className="text-xs font-mono text-muted bg-surface-2 px-2 py-1 rounded border border-border">
          {safeLat.toFixed(4)}, {safeLng.toFixed(4)}
        </span>
      </div>
      <div className="relative h-64">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={token}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="bottom-right" />

          {/* Main store marker */}
          <Marker longitude={safeLng} latitude={safeLat} anchor="bottom">
            <div className="bg-accent text-white p-2 rounded-xl shadow-glow-accent hover:scale-110 transition-transform cursor-pointer">
              <Store size={18} strokeWidth={2.5} />
            </div>
          </Marker>
        </Map>

        {/* Overlay */}
        <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-card">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-slow" />
            <p className="text-xs font-semibold text-primary truncate max-w-[180px]">
              {storeName ?? 'Assessment Location'}
            </p>
          </div>
          <p className="text-[10px] text-muted">500m catchment analysed</p>
        </div>
      </div>
    </div>
  );
}