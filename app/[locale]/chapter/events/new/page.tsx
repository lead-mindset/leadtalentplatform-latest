import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '../_components/event-form'
import { requireChapterEditor } from '@/lib/auth'
import type { ChapterRow } from '@/lib/types'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { Icons } from '@/components/ui/icons'

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
    <MainContainer className="py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/chapter' },
          { label: 'Events', href: '/chapter/events' },
          { label: 'New event' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">New Event</h1>
          <p className="max-w-2xl text-muted-foreground">
            Create a draft event, then publish when details, registration, and applications are ready.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/chapter/events">
            <Icons.ArrowLeft className="mr-2 h-4 w-4" />
            Events
          </Link>
        </Button>
      </div>

      <EventForm mode="create" editorChapter={editorChapter} />
    </MainContainer>
  )
}

