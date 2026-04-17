"use client"

import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import Image from 'next/image'

interface LocationDisplayProps {
  event: {
    event_type: 'in_person' | 'online' | 'hybrid'
    location_name?: string | null
    location_address?: string | null
    location_city?: string | null
    location_region?: string | null
    meeting_url?: string | null
    location_latitude?: number | null
    location_longitude?: number | null
  }
  className?: string
}

export function LocationDisplay({ event, className = "" }: LocationDisplayProps) {
  const { 
    event_type, 
    location_name, 
    location_address, 
    location_city, 
    location_region, 
    meeting_url,
    location_latitude,
    location_longitude 
  } = event

  const hasLocation = location_name || location_address || location_city || location_region
  const hasCoordinates = location_latitude && location_longitude

  // Generate static map URL
  const mapUrl = hasCoordinates 
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${location_latitude},${location_longitude}&zoom=15&size=400x200&maptype=roadmap&markers=color:red%7C${encodeURIComponent(location_name || 'Event Location')}%7C${location_latitude},${location_longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}`
    : null

  // Generate directions URL
  const directionsUrl = hasCoordinates && location_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location_address)}`
    : null

  if (event_type === 'online') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium">Online Event</p>
          {meeting_url && (
            <a 
              href={meeting_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Join Meeting
            </a>
          )}
        </div>
      </div>
    )
  }

  if (event_type === 'hybrid') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Online portion */}
        <div className="flex items-center gap-2 text-sm">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Online Portion</p>
            {meeting_url && (
              <a 
                href={meeting_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Join Meeting
              </a>
            )}
          </div>
        </div>

        {/* In-person portion */}
        {hasLocation && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">In-Person Location</p>
                <p className="text-muted-foreground">
                  {location_name && <span className="block">{location_name}</span>}
                  {location_address && <span className="block">{location_address}</span>}
                  {(location_city || location_region) && (
                    <span className="block">
                      {[location_city, location_region].filter(Boolean).join(', ')}
                    </span>
                  )}
                </p>
                {directionsUrl && (
                  <a 
                    href={directionsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs flex items-center gap-1"
                  >
                    <Navigation className="h-3 w-3" />
                    Get Directions
                  </a>
                )}
              </div>
            </div>

            {/* Map thumbnail */}
            {mapUrl && (
              <div className="rounded-md overflow-hidden border">
                <Image
                  src={mapUrl}
                  alt={`Map showing location: ${location_name || 'Event Location'}`}
                  width={400}
                  height={200}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // In-person event
  if (hasLocation) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Location</p>
            <p className="text-muted-foreground">
              {location_name && <span className="block">{location_name}</span>}
              {location_address && <span className="block">{location_address}</span>}
              {(location_city || location_region) && (
                <span className="block">
                  {[location_city, location_region].filter(Boolean).join(', ')}
                </span>
              )}
            </p>
            {directionsUrl && (
              <a 
                href={directionsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                <Navigation className="h-3 w-3" />
                Get Directions
              </a>
            )}
          </div>
        </div>

        {/* Map thumbnail */}
        {mapUrl && (
          <div className="rounded-md overflow-hidden border">
            <Image
              src={mapUrl}
              alt={`Map showing location: ${location_name || 'Event Location'}`}
              width={400}
              height={200}
              className="w-full h-auto"
            />
          </div>
        )}
      </div>
    )
  }

  // No location set
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <MapPin className="h-4 w-4" />
      <p>Location not specified</p>
    </div>
  )
}
