import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '../_components/event-form'
import { requireChapterEditor } from '@/lib/auth'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import type { ChapterRow } from '@/lib/types'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { Icons } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export default async function NewChapterEventPage() {
  const supabase = await createClient()
  const { user, chapter_id } = await requireChapterEditor()

  if (user.role !== 'admin') {
    if (!chapter_id) redirect('/student')
    const permission = await ChapterPermissionService.requireChapterPermission(supabase, {
      userId: user.id,
      chapterId: chapter_id,
      permissionKey: 'chapter.events.manage',
    })
    if (!permission.success) redirect('/chapter')
  }
  
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
          { label: 'Resumen', href: '/chapter' },
          { label: 'Eventos', href: '/chapter/events' },
          { label: 'Nuevo evento' },
        ]}
      />

      <PageHeader
        eyebrow="Gestión de eventos"
        title="Nuevo evento"
        description="Crea un borrador y publícalo cuando los datos, el registro y las preguntas estén listos."
        actions={(
          <Button asChild variant="outline">
          <Link href="/chapter/events">
            <Icons.ArrowLeft className="mr-2 h-4 w-4" />
            Eventos
          </Link>
          </Button>
        )}
      />

      <EventForm mode="create" editorChapter={editorChapter} />
    </MainContainer>
  )
}

