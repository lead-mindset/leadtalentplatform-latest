'use client'

import Image from 'next/image'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import type { PublicChapterProfileEvent } from '@/lib/services/chapter-profile.service'

const EVENT_TIME_ZONE = 'America/Lima'

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Date pending'

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
  })
}

function getLocation(event: PublicChapterProfileEvent) {
  if (event.event_type === 'online') return 'Online'
  if (event.event_type === 'hybrid') return event.location_name || event.location_city || event.location || 'Hybrid'
  return event.location_name || event.location_city || event.location || 'Location pending'
}

function canRenderCoverImage(src: string | null) {
  if (!src) return false

  try {
    const url = new URL(src)
    return url.hostname !== '127.0.0.1' && url.hostname !== 'localhost'
  } catch {
    return true
  }
}

function EventImageFallback() {
  return (
    <div className="flex h-full min-h-36 flex-col justify-end bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))] p-4">
      <CalendarDays className="mb-3 h-7 w-7 text-primary" />
      <p className="text-sm font-medium text-muted-foreground">LEAD event</p>
    </div>
  )
}

function EventCard({ event, featured = false }: { event: PublicChapterProfileEvent; featured?: boolean }) {
  const shouldRenderCoverImage = canRenderCoverImage(event.cover_image)

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <Card className="overflow-hidden rounded-lg transition-colors hover:border-primary/40">
        <CardContent className="p-0">
          <div className={featured ? 'grid md:grid-cols-[18rem_1fr]' : 'grid'}>
            <div className={featured ? 'relative min-h-52 bg-muted' : 'relative min-h-36 bg-muted'}>
              {shouldRenderCoverImage ? (
                <Image
                  src={event.cover_image as string}
                  alt={event.title}
                  fill
                  sizes={featured ? '(min-width: 768px) 18rem, 100vw' : '(min-width: 768px) 50vw, 100vw'}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <EventImageFallback />
              )}
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{formatDate(event.start_at)}</Badge>
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {getLocation(event)}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className={featured ? 'text-xl font-semibold tracking-tight' : 'text-base font-semibold'}>
                  {event.title}
                </h3>
                {event.description ? (
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{event.registration_count} registered</span>
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  View event
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ChapterEvents({ events }: { events: PublicChapterProfileEvent[] }) {
  const [featured, ...rest] = events

  return (
    <section id="chapter-events" className="scroll-mt-24 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Upcoming events</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Join an event to meet the chapter and start participating in LEAD.
          </p>
        </div>
        <Badge variant="outline">{events.length} upcoming</Badge>
      </div>

      {events.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <CalendarDays className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No upcoming events yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This chapter does not have published upcoming events right now. Check back soon or express interest through onboarding.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <EventCard event={featured} featured />
          {rest.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
