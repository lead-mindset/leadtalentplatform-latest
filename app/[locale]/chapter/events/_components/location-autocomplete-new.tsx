"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, X } from 'lucide-react';

interface LocationAutocompleteProps {
  value?: string;
  onChange: (locationData: { address: string; city?: string; region?: string; lat: number; lng: number }) => void;
  onClear: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Hook for autocomplete suggestions (similar to the reference implementation)
function useAutocompleteSuggestions(inputString: string) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!placesLib) return;

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;

    // Create a new session if one doesn't already exist
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const request: google.maps.places.AutocompleteRequest = {
      input: inputString,
      includedPrimaryTypes: ['establishment', 'geocode'],
      sessionToken: sessionTokenRef.current,
      language: 'en',
    };

    if (inputString === '') {
      if (suggestions.length > 0) setSuggestions([]);
      return;
    }

    setIsLoading(true);
    AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      .then(res => {
        setSuggestions(res.suggestions);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setIsLoading(false);
      });
  }, [placesLib, inputString]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  return { suggestions, isLoading, resetSession };
}

export function LocationAutocompleteNew({
  value,
  onChange,
  onClear,
  placeholder = "Search for a location or enter address",
  disabled = false,
  className = "",
}: LocationAutocompleteProps) {
  const placesLibrary = useMapsLibrary('places');
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLibraryLoaded(!!placesLibrary);
  }, [placesLibrary]);

  const { suggestions, isLoading, resetSession } = useAutocompleteSuggestions(inputValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    
    // Update parent with current input value (but no location data yet)
    onChange({
      address: newValue,
      city: '',
      region: '',
      lat: 0,
      lng: 0,
    });
  }, [onChange]);

  const handleSuggestionClick = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLibrary || !suggestion.placePrediction) return;

      const place = suggestion.placePrediction.toPlace();

      try {
        await place.fetchFields({
          fields: [
            'formattedAddress',
            'addressComponents',
            'location',
            'viewport'
          ]
        });

        // Extract city and region from address components
        let city = '';
        let region = '';
        
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

        const locationData = {
          address: place.formattedAddress || '',
          venueName: place.displayName || '',
          city,
          region,
          lat: place.location?.lat() || 0,
          lng: place.location?.lng() || 0,
        };

        setInputValue(locationData.address);
        setShowSuggestions(false);
        onChange(locationData);

        // Reset session token after place selection
        resetSession();
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    },
    [placesLibrary, onChange, resetSession]
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    setShowSuggestions(false);
    onClear();
    resetSession();
  }, [onClear, resetSession]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled || !isLibraryLoaded}
          className="w-full"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
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

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placePrediction?.placeId || index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-start gap-3 border-b border-border last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {suggestion.placePrediction?.text?.text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
