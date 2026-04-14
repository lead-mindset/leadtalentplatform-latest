import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/types'
import { AdminEventForm } from '../_components/admin-event-form'
import { getChapters } from '@/lib/actions/admin/create-chapter'

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: event }, chaptersRes] = await Promise.all([
    supabase
      .from('Event')
      .select('id, title, description, coverImage, startAt, endAt, location, meetingUrl, eventType, capacity, isPublished, chapterId, createdById, createdAt, updatedAt, accessModel, applicationFormUrl')
      .eq('id', id)
      .maybeSingle<EventRow>(),
    getChapters(),
  ])

  const chapters = 'chapters' in chaptersRes ? chaptersRes.chapters : []

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Event</h1>
          <p className="text-muted-foreground mt-1">Edit details, chapter scope, and publishing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/events">Back</Link>
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
          <AdminEventForm mode="edit" chapters={chapters} initial={event ?? null} />
        </CardContent>
      </Card>
    </div>
  )
}

