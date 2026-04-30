"use client";

import { useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

export function GoogleMapsDebug() {
  const [apiKey, setApiKey] = useState<string>('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [placesLibrary, setPlacesLibrary] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const placesLib = useMapsLibrary('places');

  useEffect(() => {

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setApiKey(key || 'NOT SET');

    if (typeof window !== 'undefined' && window.google) {
      setGoogleLoaded(true);
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          setGoogleLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 500);
      setTimeout(() => clearInterval(checkGoogle), 5000);
    }

    setPlacesLibrary(placesLib);
  }, [placesLib]);

  if (error) {
    return <div className="p-4 bg-red-100 border border-red-300 rounded">Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded space-y-2">
      <h3 className="font-bold">Google Maps Debug Info</h3>
      
      <div>
        <strong>API Key:</strong> {apiKey ? `Set (${apiKey.substring(0, 10)}...)` : 'NOT SET'}
      </div>
      
      <div>
        <strong>Google API Loaded:</strong> {googleLoaded ? 'YES' : 'NO'}
      </div>
      
      <div>
        <strong>Places Library:</strong> {placesLibrary ? 'LOADED' : 'NOT LOADED'}
      </div>
      
      <div>
        <strong>Window.google:</strong> {typeof window !== 'undefined' && window.google ? 'AVAILABLE' : 'NOT AVAILABLE'}
      </div>

      {!apiKey && (
        <div className="p-2 bg-yellow-100 border border-yellow-300 rounded">
          <strong>Action Required:</strong> Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
        </div>
      )}

      {apiKey && !googleLoaded && (
        <div className="p-2 bg-yellow-100 border border-yellow-300 rounded">
          <strong>Action Required:</strong> Google Maps API not loading. Check API key validity.
        </div>
      )}

      {apiKey && googleLoaded && !placesLibrary && (
        <div className="p-2 bg-yellow-100 border border-yellow-300 rounded">
          <strong>Action Required:</strong> Places library not loaded. Check provider configuration.
        </div>
      )}
    </div>
  );
}
