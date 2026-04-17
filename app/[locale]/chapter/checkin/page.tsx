import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import { getCheckInCounter } from '@/lib/actions/events/checkin'
import { CheckinScanner } from '../events/_components/checkin-scanner'

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function ChapterCheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { eventId } = await searchParams
  const now = new Date()
  const events = await getChapterEvents()
  const upcomingOrLive = events.filter((event) => new Date(event.end_at) >= now)
  const selectedEvent =
    upcomingOrLive.find((event) => event.id === eventId) ??
    upcomingOrLive[0] ??
    null
  const counter = selectedEvent ? await getCheckInCounter(selectedEvent.id) : null

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
        <p className="text-muted-foreground text-lg">
          Scan attendee QR codes or use manual fallback search
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedEvent ? `Scanner — ${selectedEvent.title}` : 'Scanner'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvent ? (
                <CheckinScanner
                  eventId={selectedEvent.id}
                  initialCheckedIn={counter?.checkedIn ?? 0}
                  initialTotal={counter?.total ?? selectedEvent._count.registrations}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select an upcoming event to start check-in.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming or Live Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingOrLive.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active events right now.
                </p>
              ) : (
                upcomingOrLive.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-md border p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(event.start_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event._count.registrations} registered
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={event.is_published ? 'secondary' : 'outline'}>
                        {event.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/chapter/checkin?eventId=${event.id}`}>Use here</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
