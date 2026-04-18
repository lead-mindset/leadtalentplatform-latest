import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, ChapterRow } from '@/lib/types'
import { EventForm } from '../_components/event-form'

export default async function ChapterEventDetailPage({
  params,
}: {
  params: Promise<{ id: string, locale: string }>
}) {
  const { id, locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  let editorChapter: ChapterRow | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('student_profile')
      .select('chapter_id, chapter:Chapter(id, name, university, city, region, created_at, updated_at)')
      .eq('user_id', user.id)
      .single()
    
    if (profile?.chapter) {
      // Type assertion to handle Supabase query result
      editorChapter = profile.chapter as unknown as ChapterRow
    }
  }

  const { data: event } = await supabase
    .from('event')
    .select('id, title, description, cover_image, start_at, end_at, location, meeting_url, event_type, capacity, is_published, chapter_id, created_by_id, created_at, updated_at, access_model, application_form_url')
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
          <EventForm mode="edit" initial={event ?? null} editorChapter={editorChapter} />
        </CardContent>
      </Card>
    </div>
  )
}

