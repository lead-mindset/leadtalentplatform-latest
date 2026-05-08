"use client"

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Loader2 } from 'lucide-react'
import { debounce } from 'lodash'

declare global {
  interface Window {
    google: any;
  }
}

interface LocationData {
  name?: string
  address?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  placeId?: string
}

interface LocationAutocompleteProps {
  value?: string
  onChange: (data: LocationData) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  onClear,
  placeholder = "Search for a location or enter address",
  disabled = false,
  className = ""
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (!place || !place.geometry) {
        console.warn('No place selected or no geometry available')
        return
      }

    const locationData: LocationData = {
        name: place.name || '',
        address: place.formatted_address || '',
        placeId: place.place_id || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      }

      const addressComponents = place.address_components || []
      const cityComponent = addressComponents.find((comp: any) => 
        comp.types.includes('locality')
      )
      const regionComponent = addressComponents.find((comp: any) => 
        comp.types.includes('administrative_area_level_1')
      )

      if (cityComponent) {
        locationData.city = cityComponent.long_name || cityComponent.short_name
      }

      if (regionComponent) {
        locationData.region = regionComponent.long_name || regionComponent.short_name
      }

      onChange(locationData)
      setSuggestions([])
      setShowSuggestions(false)
    })

    inputRef.current.addEventListener('input', debounce((e: any) => {
      const value = e.target.value
      if (value.length <= 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      geocodeAddress(value)
        .then(results => {
          setSuggestions(results)
          setShowSuggestions(true)
        })
        .catch(error => {
          console.error('Geocoding error:', error)
          setSuggestions([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, 300))

    inputRef.current.addEventListener('blur', () => {
      setTimeout(() => setShowSuggestions(false), 200)
    })

    inputRef.current.addEventListener('focus', () => {
      if (inputRef.current?.value && inputRef.current.value.length > 2) {
        setShowSuggestions(true)
      }
    })
  }

  const geocodeAddress = async (address: string): Promise<any[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`
      )
      const data = await response.json()
      
      return data.map((item: any) => ({
        name: item.display_name.split(',')[0]?.trim(),
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: item.display_name,

        city: item.address?.city || item.display_name.split(',')[0]?.trim(),
        region: item.address?.state || item.display_name.split(',')[1]?.trim()
      }))
    } catch (error) {
      console.error('Nominatim geocoding error:', error)
      return []
    }
  }

  const handleSuggestionSelect = (suggestion: any) => {
    const locationData: LocationData = {
      name: suggestion.name,
      address: suggestion.address,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
      city: suggestion.city,
      region: suggestion.region
    }

    onChange(locationData)
    setSuggestions([])
    setShowSuggestions(false)
    
    if (inputRef.current) {
      inputRef.current.value = suggestion.address
    }
  }

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setSuggestions([])
    setShowSuggestions(false)
    onClear?.()
  }

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete()
    }
  }, [])

  useEffect(() => {
    if (inputRef.current && value !== undefined) {
      inputRef.current.value = value
    }
  }, [value])

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          onChange={(event) => {
            onChange({ address: event.target.value })
          }}
          onFocus={() => {
            if (inputRef.current?.value && inputRef.current.value.length > 2) {
              setShowSuggestions(true)
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {(value || inputRef.current?.value) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
