"use client";

import { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, X } from 'lucide-react';
import type { LocationAutocompleteProps, LocationData } from '@/lib/types/location';

export function LocationAutocomplete({
  value,
  onChange,
  onClear,
  placeholder = "Search for a location or enter address",
  disabled = false,
  className = "",
}: LocationAutocompleteProps) {
  const placesLibrary = useMapsLibrary('places');
  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | undefined>(undefined);
  const [useFallback, setUseFallback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Google Maps API is available and initialize session token
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && placesLibrary) {
        setUseFallback(false);
        // Initialize session token when Google Maps is available
        if (!sessionToken) {
          setSessionToken(new google.maps.places.AutocompleteSessionToken());
        }
      } else {
        setUseFallback(true);
      }
    };

    // Check immediately
    checkGoogleMaps();

    // Also check after a delay in case Google Maps is still loading
    const timer = setTimeout(checkGoogleMaps, 2000);
    return () => clearTimeout(timer);
  }, [placesLibrary, sessionToken]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = async (input: string) => {
    if (!placesLibrary || input.length < 2 || !sessionToken) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const request: google.maps.places.AutocompleteRequest = {
        input,
        sessionToken,
        includedPrimaryTypes: ['establishment', 'geocode'],
      };

      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      const placePredictions = suggestions
        .map(suggestion => suggestion.placePrediction)
        .filter(Boolean) as google.maps.places.PlacePrediction[];
      
      setPredictions(placePredictions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    console.log('LocationAutocomplete: Input changed:', inputValue);
    
    // For manual input, update with basic info
    const locationData: LocationData = {
      address: inputValue,
      city: '',
      region: '',
      lat: 0,
      lng: 0,
    };
    onChange(locationData);
    
    if (inputValue.trim()) {
      console.log('LocationAutocomplete: Fetching predictions for:', inputValue);
      await fetchPredictions(inputValue);
    } else {
      setPredictions([]);
      setShowSuggestions(false);
    }
  };

  const handlePlaceSelect = async (placePrediction: google.maps.places.PlacePrediction) => {
    if (!placesLibrary) return;

    setShowSuggestions(false);
    
    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
      });

      const address = place.formattedAddress || '';
      let city = '';
      let region = '';

      // Extract city and region from address components
      if (place.addressComponents) {
        for (const component of place.addressComponents) {
          if (component.types.includes('locality')) {
            city = component.longText || '';
          }
          if (component.types.includes('administrative_area_level_1')) {
            region = component.longText || '';
          }
        }
      }

      const locationData: LocationData = {
        address,
        city,
        region,
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0,
      };
      onChange(locationData);
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setPredictions([]);
    setShowSuggestions(false);
    onClear();
  };

  // Fallback to simple text input when Google Maps is not available
  if (useFallback) {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => {
          const locationData: LocationData = {
            address: e.target.value,
            city: '',
            region: '',
            lat: 0,
            lng: 0,
          };
          onChange(locationData);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
          autoComplete="off"
        />
        
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {isLoading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {showSuggestions && predictions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.placeId || index}
              type="button"
              onClick={() => handlePlaceSelect(prediction)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {prediction.text?.text || ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
