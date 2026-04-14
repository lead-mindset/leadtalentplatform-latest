import QRCode from 'qrcode'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMyRegistrations } from '@/lib/actions/events/get-data'
import { CancelRegistrationDialog } from '@/components/events/cancel-registration-dialog'
import { ScrollToHighlightedEvent } from '@/components/events/scroll-to-highlighted-event'
import { RegistrationStatusBadge } from '@/components/events/registration-status-badge'
import { Link } from '@/i18n/routing'
import { Calendar, Clock, MapPin } from 'lucide-react'

type RegistrationWithEvent = Awaited<ReturnType<typeof getMyRegistrations>>[number]

type EventRegistrationCardProps = {
  registration: RegistrationWithEvent
  showQr: boolean
  qrDataUrl: string | null
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
    timeZoneName: 'short',
  })
}

function EventRegistrationCard({
  registration,
  showQr,
  qrDataUrl,
}: EventRegistrationCardProps) {
  const event = registration.Event
  const isRejected = registration.status === 'rejected'
  const isPending = registration.status === 'pending_review'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{event?.title ?? 'Event'}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {event?.startAt ? formatDateTime(event.startAt) : ''}
            </p>
            {event?.location ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            ) : null}
          </div>
          <RegistrationStatusBadge status={registration.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showQr && registration.status === 'registered' && qrDataUrl ? (
          <div className="border-t pt-4">
            <div className="flex items-center justify-center rounded-xl border bg-background p-4">
              <Image
                src={qrDataUrl}
                alt="Event check-in QR code"
                width={240}
                height={240}
                className="h-auto w-auto max-w-full"
                unoptimized
              />
            </div>
          </div>
        ) : null}

        {isPending ? (
          <div className="rounded-lg border bg-warning-muted/40 p-3">
            <p className="text-sm text-warning-foreground">
              Your application is under review. You'll receive an email when a decision is made.
            </p>
          </div>
        ) : null}

        {isRejected ? (
          <div className="rounded-lg border bg-muted/60 p-3">
            <p className="text-sm text-muted-foreground">Not selected for this event.</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="w-full sm:flex-1">
            <Link href={`/events/${registration.eventId}`}>Event details</Link>
          </Button>
          {registration.status === 'registered' && !registration.checkedInAt ? (
            <CancelRegistrationDialog
              registrationId={registration.id}
              eventTitle={event?.title ?? 'this event'}
              triggerClassName="w-full sm:flex-1"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function StudentEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: highlightEventId } = await searchParams
  const registrations = await getMyRegistrations()

  const qrEntries = await Promise.all(
    registrations.map(async (registration) => {
      if (registration.status !== 'registered' || !registration.qrToken) {
        return [registration.id, null] as const
      }

      const qrDataUrl = await QRCode.toDataURL(registration.qrToken, {
        margin: 1,
        width: 240,
      })

      return [registration.id, qrDataUrl] as const
    })
  )

  const qrByRegistrationId = new Map(qrEntries)

  const upcomingRegistrations = registrations.filter(
    (registration) =>
      (registration.status === 'registered' || registration.status === 'attended') &&
      registration.Event?.startAt &&
      new Date(registration.Event.startAt) > new Date()
  )

  const pendingRegistrations = registrations.filter(
    (registration) => registration.status === 'pending_review'
  )

  const pastRegistrations = registrations.filter(
    (registration) =>
      (registration.status === 'attended' || registration.status === 'rejected') &&
      registration.Event?.startAt &&
      new Date(registration.Event.startAt) < new Date()
  )

  const cancelledRegistrations = registrations.filter(
    (registration) => registration.status === 'cancelled'
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <ScrollToHighlightedEvent eventId={highlightEventId} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="mt-1 text-muted-foreground">
            Your registrations and QR codes for check-in.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/events">Browse events</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingRegistrations.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingRegistrations.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastRegistrations.length})</TabsTrigger>
          {cancelledRegistrations.length > 0 ? (
            <TabsTrigger value="cancelled">Cancelled ({cancelledRegistrations.length})</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingRegistrations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No upcoming events</p>
                <p className="mt-2 text-sm">You haven't registered for any upcoming events yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/events">Browse Events</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  id={`event-reg-${registration.eventId}`}
                  className="scroll-mt-24"
                >
                  <EventRegistrationCard
                    registration={registration}
                    showQr
                    qrDataUrl={qrByRegistrationId.get(registration.id) ?? null}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingRegistrations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No applications under review</p>
                <p className="mt-2 text-sm">
                  Your applications will appear here while editors review them.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRegistrations.map((registration) => (
                <EventRegistrationCard
                  key={registration.id}
                  registration={registration}
                  showQr={false}
                  qrDataUrl={null}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastRegistrations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No past events</p>
                <p className="mt-2 text-sm">Events you've attended will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastRegistrations.map((registration) => (
                <EventRegistrationCard
                  key={registration.id}
                  registration={registration}
                  showQr={registration.status === 'attended'}
                  qrDataUrl={qrByRegistrationId.get(registration.id) ?? null}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {cancelledRegistrations.length > 0 ? (
          <TabsContent value="cancelled" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {cancelledRegistrations.map((registration) => (
                <EventRegistrationCard
                  key={registration.id}
                  registration={registration}
                  showQr={false}
                  qrDataUrl={null}
                />
              ))}
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
