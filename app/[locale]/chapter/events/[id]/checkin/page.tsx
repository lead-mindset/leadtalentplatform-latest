import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/types'
import { CheckinScanner } from '../../_components/checkin-scanner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCheckInCounter } from '@/lib/actions/events/checkin'

export default async function ChapterEventCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('Event')
    .select('*')
    .eq('id', id)
    .maybeSingle<EventRow>()
  const counter = event ? await getCheckInCounter(event.id) : null

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Check-in</h1>
          <p className="text-muted-foreground mt-1">
            {event?.title ?? 'Event'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/chapter/events/${id}`}>Back</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/chapter/events">All events</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          {event ? (
            <CheckinScanner
              eventId={event.id}
              initialCheckedIn={counter?.checkedIn ?? 0}
              initialTotal={counter?.total ?? 0}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Event not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

