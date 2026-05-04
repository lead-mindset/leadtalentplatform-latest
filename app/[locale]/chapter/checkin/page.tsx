import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import { getCheckInCounter } from '@/lib/actions/events/checkin'
import { CheckinScanner } from '../events/_components/checkin-scanner'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'

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

function CheckInSummary({
  checkedIn,
  total,
}: {
  checkedIn: number
  total: number
}) {
  const percentage = total > 0 ? Math.min(100, Math.round((checkedIn / total) * 100)) : 0

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground">Attended</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-success">{checkedIn}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground">Registered</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{total}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground">Progress</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{percentage}%</p>
      </div>
    </div>
  )
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
    <MainContainer className="py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/chapter' },
          { label: 'Check-in' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
          <p className="max-w-3xl text-muted-foreground">
            Scan QR codes, search attendees, or paste a token for the selected event.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/chapter/events">Chapter events</Link>
        </Button>
      </div>

      {selectedEvent ? (
        <>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              <Badge variant={selectedEvent.is_published ? 'success' : 'outline'}>
                {selectedEvent.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <CheckInSummary
              checkedIn={counter?.checkedIn ?? 0}
              total={counter?.total ?? selectedEvent._count.registrations}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <CheckinScanner
              eventId={selectedEvent.id}
              initialCheckedIn={counter?.checkedIn ?? 0}
              initialTotal={counter?.total ?? selectedEvent._count.registrations}
            />

            <aside className="space-y-3">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold">Event selector</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Switch quickly if you are operating multiple chapter events.
                </p>
              </div>
              <div className="divide-y overflow-hidden rounded-lg border bg-card">
                {upcomingOrLive.slice(0, 8).map((event) => (
                  <div key={event.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{event.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.start_at)}</p>
                        <p className="text-xs text-muted-foreground">{event._count.registrations} registered</p>
                      </div>
                      <Button asChild size="sm" variant={event.id === selectedEvent.id ? 'default' : 'outline'}>
                        <Link href={`/chapter/checkin?eventId=${event.id}`}>
                          {event.id === selectedEvent.id ? 'Using' : 'Use'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Icons.Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No active check-in events</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Create or publish an upcoming event before opening check-in.
            </p>
            <Button asChild className="mt-6">
              <Link href="/chapter/events">Manage events</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </MainContainer>
  )
}
