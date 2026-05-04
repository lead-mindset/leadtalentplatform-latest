import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '../_components/event-form'
import { requireChapterEditor } from '@/lib/auth'
import type { ChapterRow } from '@/lib/types'

export default async function NewChapterEventPage() {
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
  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header with Clear Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">New Event</h1>
          <p className="text-muted-foreground text-lg">Create a draft event for your chapter</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/chapter/events">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm mode="create" editorChapter={editorChapter} />
        </CardContent>
      </Card>
    </div>
  )
}

