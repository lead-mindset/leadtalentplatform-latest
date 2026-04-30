"use client";

import { useMemo, useRef, useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function PlacesAutocomplete({ 
  onPlaceSelect, 
  placeholder = "Search for a place...", 
  className,
  inputClassName = "w-full px-3 py-2 border border-gray-300 rounded-md"
}: PlacesAutocompleteProps) {
  const placesLibrary = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!placesLibrary || !inputRef.current) {
      setIsLoading(!placesLibrary);
      return;
    }

    const autocompleteInstance = new placesLibrary.Autocomplete(inputRef.current, {
      fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      types: ['establishment', 'geocode']
    });

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      if (place.geometry?.location) {
        onPlaceSelect(place);
      }
    });

    setAutocomplete(autocompleteInstance);
    setIsLoading(false);

    return () => {

      google?.maps?.event?.clearInstanceListeners(autocompleteInstance);
    };
  }, [placesLibrary, onPlaceSelect]);

  return (
    <div className={className}>
      <input 
        ref={inputRef}
        type="text" 
        placeholder={placeholder}
        className={inputClassName}
        disabled={isLoading}
        autoComplete="off"
      />
      {isLoading && (
        <p className="text-sm text-gray-500 mt-1">Loading Places API...</p>
      )}
    </div>
  );
}

export function usePlacesService(mapOrElement?: HTMLDivElement | google.maps.Map) {
  const placesLibrary = useMapsLibrary('places');
  
  const placesService = useMemo(() => {
    if (!placesLibrary || !mapOrElement) return null;
    
    return new placesLibrary.PlacesService(mapOrElement);
  }, [placesLibrary, mapOrElement]);

  return placesService;
}

export function useGeocoder() {
  const geocodingLibrary = useMapsLibrary('geocoding');
  
  const geocoder = useMemo(() => {
    if (!geocodingLibrary) return null;
    
    return new geocodingLibrary.Geocoder();
  }, [geocodingLibrary]);

  return geocoder;
}
