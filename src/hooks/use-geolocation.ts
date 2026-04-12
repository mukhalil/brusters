"use client";

import { useState, useCallback } from "react";

interface GeolocationState {
  location: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ location: null, error: "Location is not supported by this browser.", loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        let message: string;
        if (err.code === err.PERMISSION_DENIED) {
          // iOS Safari: go to Settings → Privacy & Security → Location Services → Safari
          message =
            "Location access is blocked. On iPhone, go to Settings → Privacy & Security → Location Services → Safari → While Using the App, then try again.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = "Your location couldn't be determined. Please describe your car instead.";
        } else {
          message = "Location request timed out. Please describe your car instead.";
        }
        setState({ location: null, error: message, loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { ...state, requestLocation };
}
