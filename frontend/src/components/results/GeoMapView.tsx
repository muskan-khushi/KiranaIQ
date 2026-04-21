import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { Store } from 'lucide-react';
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

  // ── No token fallback: OpenStreetMap static embed ──────────────────────
  if (!token) {
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${safeLng - 0.005},${safeLat - 0.003},${safeLng + 0.005},${safeLat + 0.003}&layer=mapnik&marker=${safeLat},${safeLng}`;

    return (
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest">Store Location</p>
          {hasRealCoords && (
            <span className="text-xs font-mono text-muted bg-surface-2 px-2 py-1 rounded border border-border">
              {safeLat.toFixed(4)}, {safeLng.toFixed(4)}
            </span>
          )}
        </div>
        <div className="relative h-64">
          <iframe
            title="Store location map"
            src={osmUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
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

  // ── Mapbox GL map ──────────────────────────────────────────────────────
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