import { Suspense } from 'react'
import NavHeader from '@/components/global/navigation/NavHeader'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/actions/events/get-data'
import { registerForEvent } from '@/lib/actions/events/register'
import { cancelRegistration } from '@/lib/actions/events/cancel-registration'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link, redirect } from '@/i18n/routing'
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react'
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

async function EventContent({ id }: { id: string }) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const event = await getEventById(id)
  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 pt-28 pb-16">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Event not found.
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const now = Date.now()
  const startsAt = new Date(event.startAt).getTime()
  const registrationClosed = Number.isFinite(startsAt) ? now >= startsAt : false

  let myRegistration: { id: string; status: string; checkedInAt: string | null } | null = null
  if (auth.user) {
    const { data } = await supabase
      .from('EventRegistration')
      .select('id, status, checkedInAt')
      .eq('eventId', event.id)
      .eq('userId', auth.user.id)
      .maybeSingle()

    myRegistration = data ?? null
  }

  const isRegistered = myRegistration?.status === 'registered' || myRegistration?.status === 'attended'
  const canCancel = myRegistration?.status === 'registered' && !myRegistration.checkedInAt && !registrationClosed

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <EventTypeBadge eventType={event.eventType} />
              {event.capacity !== null && (
                <Badge variant="outline" className="tabular-nums">
                  {event._count.registrations}/{event.capacity}
                </Badge>
              )}
              {!event.isPublished && <Badge variant="destructive">Draft</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <p className="text-sm text-muted-foreground">
              {event.Chapter ? `${event.Chapter.name} · ${event.Chapter.university}` : 'Global'}
              {event.CreatedBy?.name ? ` · Created by ${event.CreatedBy.name}` : ''}
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/events">Back to events</Link>
          </Button>
        </div>

        {event.coverImage && (
          <Card className="overflow-hidden">
            <div className="relative h-56 w-full bg-muted">
              <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {event.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No description provided.</p>
              )}

              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDateTime(event.startAt)} — {formatDateTime(event.endAt)}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{event._count.registrations} registered</span>
                </div>
                {event.meetingUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:opacity-70 transition-opacity break-all"
                    >
                      {event.meetingUrl}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!auth.user ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Sign in to register and receive your QR code.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/auth/login?next=/events/${event.id}`}>Sign in</Link>
                  </Button>
                </>
              ) : isRegistered ? (
                <>
                  <Badge variant="secondary" className="w-fit">
                    You’re registered
                  </Badge>
                  {canCancel ? (
                    <form action={cancelRegistration}>
                      <input type="hidden" name="registrationId" value={myRegistration?.id ?? ''} />
                      <Button type="submit" variant="outline" className="w-full">
                        Cancel registration
                      </Button>
                    </form>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Cancellation isn’t available.
                    </p>
                  )}
                  <Button asChild className="w-full">
                    <Link href="/student/events">View my QR code</Link>
                  </Button>
                </>
              ) : (
                <>
                  {registrationClosed ? (
                    <p className="text-sm text-muted-foreground">
                      Registration closed (event has started).
                    </p>
                  ) : null}
                  <form action={registerForEvent}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <Button type="submit" className="w-full" disabled={registrationClosed}>
                      Register
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <Suspense fallback={null}>
        <NavHeader />
      </Suspense>
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <EventContent id={id} />
      </Suspense>
    </>
  )
}

