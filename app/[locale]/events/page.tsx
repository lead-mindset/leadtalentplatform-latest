import type { Metadata } from 'next'
import { Suspense } from 'react'
import Image from 'next/image'
import { Calendar, MapPin, Users } from 'lucide-react'
import { getPublishedEvents } from '@/lib/actions/events/get-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { Navbar } from '../(public)/_components/navbar'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse upcoming LEAD events and register online.',
}

function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const label =
    eventType === 'online' ? 'Online' : eventType === 'hybrid' ? 'Hybrid' : 'In-person'
  return <Badge variant="outline">{label}</Badge>
}

async function EventsContent() {
  const events = await getPublishedEvents()

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-6 px-6 pb-16 pt-28">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-muted-foreground">
            Browse upcoming events and register inside LEAD.
          </p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No events are published yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                {event.coverImage ? (
                  <div className="relative h-40 w-full bg-muted">
                    <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
                  </div>
                ) : null}

                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <EventTypeBadge eventType={event.eventType} />
                    {event.capacity !== null ? (
                      <Badge variant="outline" className="tabular-nums">
                        {event._count.registrations}/{event.capacity}
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(event.startAt)}</span>
                    </div>

                    {event.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {event.Chapter
                          ? `${event.Chapter.name} / ${event.Chapter.university}`
                          : 'Global'}
                      </span>
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/events/${event.id}`}>View details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function EventsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <EventsContent />
      </Suspense>
    </>
  )
}
