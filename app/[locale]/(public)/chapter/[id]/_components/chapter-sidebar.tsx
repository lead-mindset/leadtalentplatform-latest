'use client'

import { Activity, CalendarDays, MapPin, Navigation, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PublicChapterProfile } from '@/lib/services/chapter-profile.service'

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function ActivitySignals({ profile }: { profile: PublicChapterProfile }) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Chapter snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatRow
          icon={CalendarDays}
          label="Upcoming events"
          value={profile.stats.upcomingEventsCount}
        />
        <StatRow
          icon={Users}
          label="Approved members"
          value={profile.stats.approvedMemberCount}
        />
        <StatRow
          icon={CalendarDays}
          label="Past events"
          value={profile.stats.pastEventsCount}
        />
        <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
          These signals come from approved roster and published event data.
        </p>
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
      <ActivitySignals profile={profile} />
      <LocationCard profile={profile} />
    </>
  )
}
