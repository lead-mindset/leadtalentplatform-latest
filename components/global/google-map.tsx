"use client";

import { Map as GoogleMap, useMap, MapCameraChangedEvent, MapCameraProps } from '@vis.gl/react-google-maps';
import { useCallback, useState } from 'react';

interface BaseMapProps {
  className?: string;
  style?: React.CSSProperties;
  mapId?: string;
  reuseMaps?: boolean;
}

interface UncontrolledMapProps extends BaseMapProps {
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  defaultHeading?: number;
  defaultTilt?: number;
}

interface ControlledMapProps extends BaseMapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  heading?: number;
  tilt?: number;
  onCameraChanged?: (event: MapCameraChangedEvent) => void;
}

type MapProps = (UncontrolledMapProps | ControlledMapProps) & {
  gestureHandling?: 'auto' | 'cooperative' | 'greedy' | 'none';
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  streetViewControl?: boolean;
  rotateControl?: boolean;
  fullscreenControl?: boolean;
};

// Uncontrolled Map component (default behavior)
export function Map({ 
  defaultCenter = { lat: -34.397, lng: 150.644 }, 
  defaultZoom = 10,
  className, 
  style = { width: '100%', height: '400px' },
  mapId = "DEMO_MAP_ID",
  reuseMaps = false,
  gestureHandling = 'auto',
  disableDefaultUI = false,
  ...controls
}: UncontrolledMapProps & Pick<MapProps, 'className' | 'style' | 'mapId' | 'reuseMaps' | 'gestureHandling' | 'disableDefaultUI' | 'zoomControl' | 'mapTypeControl' | 'scaleControl' | 'streetViewControl' | 'rotateControl' | 'fullscreenControl'>) {
  return (
    <GoogleMap
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      className={className}
      style={style}
      mapId={mapId}
      reuseMaps={reuseMaps}
      gestureHandling={gestureHandling}
      disableDefaultUI={disableDefaultUI}
      {...controls}
    />
  );
}

// Controlled Map component
export function ControlledMap({ 
  center = { lat: -34.397, lng: 150.644 }, 
  zoom = 10,
  className, 
  style = { width: '100%', height: '400px' },
  mapId = "DEMO_MAP_ID",
  reuseMaps = false,
  onCameraChanged,
  gestureHandling = 'auto',
  disableDefaultUI = false,
  ...controls
}: ControlledMapProps & Pick<MapProps, 'className' | 'style' | 'mapId' | 'reuseMaps' | 'gestureHandling' | 'disableDefaultUI' | 'zoomControl' | 'mapTypeControl' | 'scaleControl' | 'streetViewControl' | 'rotateControl' | 'fullscreenControl'>) {
  return (
    <GoogleMap
      center={center}
      zoom={zoom}
      className={className}
      style={style}
      mapId={mapId}
      reuseMaps={reuseMaps}
      onCameraChanged={onCameraChanged}
      gestureHandling={gestureHandling}
      disableDefaultUI={disableDefaultUI}
      {...controls}
    />
  );
}

// Hook for accessing map instance within child components
export function useMapInstance() {
  return useMap();
}

// Enhanced Map with state management example
export function EnhancedMap({ 
  defaultCenter = { lat: -34.397, lng: 150.644 }, 
  defaultZoom = 10,
  className, 
  style = { width: '100%', height: '400px' },
  mapId = "DEMO_MAP_ID",
  reuseMaps = true
}: UncontrolledMapProps & Pick<MapProps, 'className' | 'style' | 'mapId' | 'reuseMaps'>) {
  const [cameraProps, setCameraProps] = useState<MapCameraProps>({
    center: defaultCenter,
    zoom: defaultZoom
  });

  const handleCameraChange = useCallback((event: MapCameraChangedEvent) => {
    setCameraProps(event.detail);
  }, []);

  return (
    <GoogleMap
      {...cameraProps}
      className={className}
      style={style}
      mapId={mapId}
      reuseMaps={reuseMaps}
      onCameraChanged={handleCameraChange}
      gestureHandling="auto"
      zoomControl={true}
      mapTypeControl={true}
      scaleControl={true}
      streetViewControl={true}
      rotateControl={true}
      fullscreenControl={true}
    />
  );
}
