import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireChapterEditor } from '@/lib/auth'
import type { EventRow, ChapterRow, EventApplicationQuestionRow } from '@/lib/types'
import { EventForm } from '../_components/event-form'

export default async function ChapterEventDetailPage({
  params,
}: {
  params: Promise<{ id: string, locale: string }>
}) {
  const { id, locale } = await params
  const supabase = await createClient()
  const { chapter_id } = await requireChapterEditor()
  
  let editorChapter: ChapterRow | null = null
  if (chapter_id) {
    const { data: chapter } = await supabase
      .from('chapter')
      .select('id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point')
      .eq('id', chapter_id)
      .maybeSingle()

    editorChapter = chapter
  }

  const { data: event } = await supabase
    .from('event')
    .select('id, title, description, cover_image, start_at, end_at, location, meeting_url, event_type, capacity, is_published, chapter_id, created_by_id, created_at, updated_at, access_model, application_form_url')
    .eq('id', id)
    .maybeSingle<EventRow>()

  const { data: applicationQuestions } = await supabase
    .from('event_application_question')
    .select('*')
    .eq('event_id', id)
    .order('sort_order', { ascending: true })

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground mt-1">Update details and publishing status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/chapter/events`}>Back</Link>
          </Button>
          {event?.id && (
            <Button asChild variant="outline">
              <Link href={`/${locale}/chapter/events/${event.id}/checkin`}>Check-in</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event?.title ?? 'Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            mode="edit"
            initial={event ?? null}
            editorChapter={editorChapter}
            applicationQuestions={(applicationQuestions ?? []) as EventApplicationQuestionRow[]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

