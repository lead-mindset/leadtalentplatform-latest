import { Suspense } from 'react'
import NavHeader from '@/components/global/navigation/NavHeader'
import { getPublishedEvents } from '@/lib/actions/events/get-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { Calendar, MapPin, Users } from 'lucide-react'
import Image from 'next/image'

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
  return <Badge variant="secondary">{label}</Badge>
}

async function EventsContent() {
  const events = await getPublishedEvents()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
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
            {events.map((e) => (
              <Card key={e.id} className="overflow-hidden">
                {e.coverImage && (
                  <div className="relative h-40 w-full bg-muted">
                    <Image
                      src={e.coverImage}
                      alt={e.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <EventTypeBadge eventType={e.eventType} />
                    {e.capacity !== null && (
                      <Badge variant="outline" className="tabular-nums">
                        {e._count.registrations}/{e.capacity}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{e.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(e.startAt)}</span>
                    </div>
                    {e.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{e.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {e.Chapter ? `${e.Chapter.name} · ${e.Chapter.university}` : 'Global'}
                      </span>
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/events/${e.id}`}>View details</Link>
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
      <Suspense fallback={null}>
        <NavHeader />
      </Suspense>
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <EventsContent />
      </Suspense>
    </>
  )
}

