import { useState, useCallback } from 'react';

export type PermissionState = 'idle' | 'loading' | 'success' | 'denied' | 'unavailable';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState;
}

export interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => void;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permissionState: 'idle',
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Geolocation wird von diesem Browser nicht unterstützt.',
        loading: false,
        permissionState: 'unavailable',
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, permissionState: 'loading', error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionState: 'success',
        });
      },
      (err) => {
        const isDenied = err.code === 1; // GeolocationPositionError.PERMISSION_DENIED
        setState({
          latitude: null,
          longitude: null,
          error: err.message,
          loading: false,
          permissionState: isDenied ? 'denied' : 'unavailable',
        });
      },
      GEOLOCATION_OPTIONS
    );
  }, []);

  return { ...state, requestLocation };
}
