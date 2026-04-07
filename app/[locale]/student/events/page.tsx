import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMyRegistrations } from '@/lib/actions/events/get-data'
import { CancelRegistrationDialog } from '@/components/events/cancel-registration-dialog'
import { ScrollToHighlightedEvent } from '@/components/events/scroll-to-highlighted-event'
import QRCode from 'qrcode'
import Image from 'next/image'
import { Link } from '@/i18n/routing'

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

export default async function StudentEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: highlightEventId } = await searchParams
  const registrations = await getMyRegistrations()

  const active = registrations.filter((r) => r.status === 'registered' || r.status === 'attended')
  const cancelled = registrations.filter((r) => r.status === 'cancelled')

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <ScrollToHighlightedEvent eventId={highlightEventId} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-1">
            Your registrations and QR codes for check-in.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/events">Browse events</Link>
        </Button>
      </div>

      {active.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You don’t have any active event registrations.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {await Promise.all(
            active.map(async (r) => {
              const event = r.Event
              const qrDataUrl = await QRCode.toDataURL(r.qrToken, { margin: 1, width: 240 })

              return (
                <Card
                  key={r.id}
                  id={`event-reg-${r.eventId}`}
                  className="overflow-hidden scroll-mt-24"
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{event?.title ?? 'Event'}</CardTitle>
                      <Badge variant={r.status === 'attended' ? 'secondary' : 'outline'}>
                        {r.status === 'attended' ? 'Attended' : 'Registered'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event?.startAt ? formatDateTime(event.startAt) : ''}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center rounded-xl border bg-white p-4 dark:bg-white">
                      <Image
                        src={qrDataUrl}
                        alt="Event check-in QR code"
                        width={240}
                        height={240}
                        className="h-auto w-auto max-w-full"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button asChild variant="outline" className="w-full sm:flex-1">
                        <Link href={`/events/${r.eventId}`}>Event details</Link>
                      </Button>
                      {r.status === 'registered' && !r.checkedInAt && (
                        <CancelRegistrationDialog
                          registrationId={r.id}
                          eventTitle={event?.title ?? 'this event'}
                          triggerClassName="w-full sm:flex-1"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {cancelled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cancelled.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {r.Event?.title ?? 'Event'}
                </span>
                <Badge variant="outline">Cancelled</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
