import { useState, useEffect, useCallback } from 'react';

interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(autoCapture = true) {
  const [state, setState] = useState<GeoState>({
    lat: null, lng: null, accuracy: null, error: null, loading: false,
  });

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocation not supported', loading: false }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        error: null,
        loading: false,
      }),
      (err) => setState(s => ({ ...s, error: err.message, loading: false })),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (autoCapture) capture();
  }, [autoCapture, capture]);

  return { ...state, capture };
}