"use client";

import { ReactNode, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface GoogleMapsProviderProps {
  children?: ReactNode;
  fallback?: ReactNode;
  language?: string;
  region?: string;
}

export function GoogleMapsProvider({ 
  children, 
  fallback,
  language = 'en',
  region = 'US'
}: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [hasError, setHasError] = useState(false);
  
  if (!apiKey) {
    return <>{fallback ?? children}</>;
  }

  if (hasError) {
    return fallback || <div>Unable to load Google Maps. Please try again later.</div>;
  }

  return (
    <APIProvider 
      apiKey={apiKey}
      libraries={['places']}
      language={language}
      region={region}
      solutionChannel="GMP_VISGL_reactgooglemaps"
      onLoad={() => console.log('Google Maps API loaded successfully')}
      onError={(error) => {
        console.error('Google Maps API loading error:', error);
        setHasError(true);
      }}
    >
      {children}
    </APIProvider>
  );
}
