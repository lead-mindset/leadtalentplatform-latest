import { Suspense } from 'react'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Monitor,
  Users,
} from 'lucide-react'
import { getPublishedEvents } from '@/lib/actions/events/get-data'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { Navbar } from '../(public)/_components/navbar'
import { MainContainer } from '@/components/global/main-container'
import { cn } from '@/lib/utils'
import type { EventWithDetails } from '@/lib/types'

export const metadata = {
  title: 'Events',
  description: 'Browse upcoming LEAD events and register online.',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date pending'

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time pending'

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getEventTypeLabel(eventType: EventWithDetails['event_type']) {
  if (eventType === 'online') return 'Online'
  if (eventType === 'hybrid') return 'Hybrid'
  return 'In person'
}

function getLocationLabel(event: EventWithDetails) {
  if (event.event_type === 'online') return 'Online'
  if (event.event_type === 'hybrid') {
    return event.location_name || event.location_city || event.location || 'Hybrid'
  }

  return event.location_name || event.location_city || event.location || 'Location pending'
}

function getEventTiming(event: EventWithDetails) {
  const now = Date.now()
  const start = new Date(event.start_at).getTime()
  const end = new Date(event.end_at).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { label: 'Date pending', variant: 'outline' as const }
  }

  if (now >= start && now <= end) {
    return { label: 'Live now', variant: 'live' as const }
  }

  if (now > end) {
    return { label: 'Past event', variant: 'outline' as const }
  }

  return event.access_model === 'application'
    ? { label: 'Application required', variant: 'info' as const }
    : { label: 'Open registration', variant: 'success' as const }
}

function getAvailabilityLabel(event: EventWithDetails) {
  if (event.capacity === null) return 'Open capacity'

  const remaining = Math.max(0, event.capacity - event._count.registrations)
  if (remaining === 0) return 'Full'
  if (remaining === 1) return '1 spot left'
  return `${remaining} spots left`
}

function getAvailabilityVariant(event: EventWithDetails) {
  if (event.capacity === null) return 'secondary' as const

  const remaining = Math.max(0, event.capacity - event._count.registrations)
  if (remaining === 0) return 'destructive' as const
  if (remaining <= 10) return 'warning' as const
  return 'secondary' as const
}

function EventCard({ event }: { event: EventWithDetails }) {
  const timing = getEventTiming(event)
  const ownerChapter = event.chapter?.name ?? event.owner_chapter?.name ?? 'LEAD'
  const availability = getAvailabilityLabel(event)
  const availabilityVariant = getAvailabilityVariant(event)

  return (
    <Card className={cn('overflow-hidden transition-colors hover:border-primary/40', timing.label === 'Past event' && 'opacity-80')}>
      <CardContent className="p-0">
        <Link href={`/events/${event.id}`} className="block">
          <div className="grid gap-0 md:grid-cols-[11rem_1fr]">
            <div className="flex border-b bg-muted/40 p-4 md:border-b-0 md:border-r md:p-5">
              <div className="flex w-full flex-row items-center gap-4 md:flex-col md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{formatDate(event.start_at)}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground md:text-2xl">{formatTime(event.start_at)}</p>
                </div>
                <Badge variant={timing.variant}>{timing.label}</Badge>
              </div>
            </div>

            <div className="space-y-5 p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
                    <Badge variant={availabilityVariant}>{availability}</Badge>
                  </div>
                  <h2 className="line-clamp-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {event.title || 'Untitled event'}
                  </h2>
                </div>

                <span
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full shrink-0 justify-between sm:w-auto sm:min-w-32'
                  )}
                  aria-hidden="true"
                >
                  View details
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ownerChapter}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  {event.event_type === 'online' ? (
                    <Monitor className="h-4 w-4 shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{getLocationLabel(event)}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {event._count.registrations} registered
                    {event.capacity !== null ? ` / ${event.capacity}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

async function EventsContent() {
  const events: EventWithDetails[] = await getPublishedEvents()
  const now = Date.now()
  const upcomingEvents = events
    .filter((event) => new Date(event.end_at).getTime() >= now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
  const pastEvents = events
    .filter((event) => new Date(event.end_at).getTime() < now)
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
  const openEvents = upcomingEvents.length

  return (
    <main className="min-h-screen bg-background">
      <MainContainer className="space-y-8 pb-20 pt-8 md:pt-12">
        <section className="space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="outline" className="w-fit">
                LEAD events
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                  Find your next LEAD event
                </h1>
                <p className="text-base text-muted-foreground md:text-lg">
                  Browse public events, chapter programs, and application-based opportunities from the LEAD community.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-2xl font-semibold">{events.length}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-2xl font-semibold">{openEvents}</p>
                <p className="text-xs text-muted-foreground">Upcoming/live</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Upcoming and live events appear first. Past events remain below as a reference for the LEAD community.</span>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-b pb-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Upcoming and live events</h2>
              <p className="text-sm text-muted-foreground">Select an event to view details and register or apply.</p>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">No upcoming events are published yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Check back soon for upcoming LEAD opportunities.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {pastEvents.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Past events</h2>
                <p className="text-sm text-muted-foreground">Browse previous LEAD programs and community activity.</p>
              </div>
            </div>

            <div className="space-y-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </MainContainer>
    </main>
  )
}

export default function EventsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading events...
          </div>
        }
      >
        <EventsContent />
      </Suspense>
    </div>
  )
}
