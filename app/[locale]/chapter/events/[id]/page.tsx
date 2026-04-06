import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/types'
import { EventForm } from '../_components/event-form'

export default async function ChapterEventDetailPage({
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

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground mt-1">Update details and publishing status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/chapter/events">Back</Link>
          </Button>
          {event?.id && (
            <Button asChild variant="outline">
              <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event?.title ?? 'Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm mode="edit" initial={event ?? null} />
        </CardContent>
      </Card>
    </div>
  )
}

