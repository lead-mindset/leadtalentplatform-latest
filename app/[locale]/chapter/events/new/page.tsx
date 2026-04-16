import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '../_components/event-form'
import type { ChapterRow } from '@/lib/types'

export default async function NewChapterEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let editorChapter: ChapterRow | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('StudentProfile')
      .select('chapterId, chapter:Chapter(id, name, university, city, region, createdAt, updatedAt)')
      .eq('userId', user.id)
      .single()
    
    if (profile?.chapter) {
      // Type assertion to handle Supabase query result
      editorChapter = profile.chapter as unknown as ChapterRow
    }
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

