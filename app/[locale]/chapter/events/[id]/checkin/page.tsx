import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { Icons } from '@/components/ui/icons'
import { CheckinScanner } from '../../_components/checkin-scanner'
import { getCheckInCounter } from '@/lib/actions/events/checkin'
import { assertCanAccessEvent } from '@/lib/actions/events/access'

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

export default async function ChapterEventCheckinPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const access = await assertCanAccessEvent(id, 'chapter.events.check_in')
  const event = 'error' in access ? null : access.event
  const counter = event ? await getCheckInCounter(event.id) : null

  if (!event) {
    return (
      <MainContainer className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Icons.Ticket className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Event check-in unavailable</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              This event may have been removed, or your chapter may not have access to manage check-in.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild>
                <Link href={`/${locale}/chapter/events`}>Back to events</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/chapter/checkin`}>Check-in hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  return (
    <MainContainer className="py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: `/${locale}/chapter` },
          { label: 'Events', href: `/${locale}/chapter/events` },
          { label: 'Check-in' },
        ]}
      />

      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Event Check-in</h1>
            <p className="max-w-2xl text-muted-foreground">
              {event.title}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}/chapter/events/${id}`}>
                <Icons.ArrowLeft className="mr-2 h-4 w-4" />
                Event
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/chapter/checkin`}>
                Check-in hub
              </Link>
            </Button>
          </div>
        </div>

        <CheckInSummary
          checkedIn={counter?.checkedIn ?? 0}
          total={counter?.total ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CheckinScanner
          eventId={event.id}
          initialCheckedIn={counter?.checkedIn ?? 0}
          initialTotal={counter?.total ?? 0}
        />

        <aside className="space-y-3">
          <Card>
            <CardContent className="space-y-3 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icons.Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Operator notes</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Only approved registered attendees can be checked in. Pending, rejected, cancelled, duplicate, or wrong-event codes are blocked.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-5">
              <h2 className="font-semibold">Fast recovery</h2>
              <p className="text-sm text-muted-foreground">
                If a scan fails, search by name or email before asking the attendee to find a new QR code.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/${locale}/chapter/events`}>
                  All chapter events
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </MainContainer>
  )
}

