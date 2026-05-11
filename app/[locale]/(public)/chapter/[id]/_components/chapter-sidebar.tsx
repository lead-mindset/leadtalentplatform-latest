'use client'

import { MapPin, Navigation, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PublicChapterProfile } from '@/lib/services/chapter-profile.service'

function ChapterPathwaysCard() {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Ways to connect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>Attend an event to meet the community in context.</p>
        <p>Complete onboarding if you want the chapter team to understand your interests.</p>
        <p>Follow chapter updates when social links are available.</p>
      </CardContent>
    </Card>
  )
}

function LocationCard({ profile }: { profile: PublicChapterProfile }) {
  const { chapter } = profile
  const hasCoordinates = chapter.latitude !== null && chapter.longitude !== null
  const locationText = [chapter.university, chapter.city, chapter.region].filter(Boolean).join(' · ')

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-primary" />
          Chapter location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">{chapter.university}</p>
          {locationText && (
            <p className="mt-1 text-sm text-muted-foreground">{locationText}</p>
          )}
        </div>

        {hasCoordinates ? (
          <a
            href={`https://www.google.com/maps?q=${chapter.latitude},${chapter.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Navigation className="h-4 w-4" />
            Open in Google Maps
          </a>
        ) : (
          <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Map details will be added once this chapter location is verified.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ChapterSidebar({ profile }: { profile: PublicChapterProfile }) {
  return (
    <>
      <ChapterPathwaysCard />
      <LocationCard profile={profile} />
    </>
  )
}
