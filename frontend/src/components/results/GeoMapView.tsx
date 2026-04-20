import { useState } from 'react';
// @ts-ignore
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { MapPin, Store } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  lat: number;
  lng: number;
}

export default function GeoMapView({ lat, lng }: Props) {
  // Fallback for UI testing if you haven't put your token in .env yet
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const [viewState, setViewState] = useState({
    longitude: lng,
    latitude: lat,
    zoom: 15
  });

  if (!mapboxToken) {
    return (
      <div className="w-full h-full min-h-[300px] bg-primary/5 rounded-xl border border-border border-dashed flex flex-col items-center justify-center text-center p-6">
        <MapPin className="text-muted mb-2" size={32} />
        <p className="text-primary font-medium">Mapbox Token Required</p>
        <p className="text-sm text-muted mt-1">Add VITE_MAPBOX_TOKEN to your .env file to render the map.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-border relative">
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11" // Clean, light aesthetic
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="bottom-right" />
        
        {/* Main Store Marker */}
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="bg-primary text-surface p-2 rounded-full shadow-aesthetic animate-bounce">
            <Store size={20} />
          </div>
        </Marker>

        {/* Mock Competitor Marker (Just for visual flair in demo) */}
        <Marker longitude={lng + 0.002} latitude={lat + 0.001} anchor="bottom">
          <div className="bg-danger/10 text-danger p-1.5 rounded-full border border-danger/20">
            <Store size={14} />
          </div>
        </Marker>
      </Map>

      {/* Overlay Badge */}
      <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-sm">
        <p className="text-xs font-semibold text-primary">Catchment Radius: 500m</p>
      </div>
    </div>
  );
}