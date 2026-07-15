import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type {
  EventRow,
  ChapterRow,
  EventApplicationQuestionRow,
  EventPathwayMetadataRow,
} from '@/lib/types'
import { EventForm } from '../_components/event-form'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { Icons } from '@/components/ui/icons'
import { assertCanAccessEvent, assertCanManageEvent } from '@/lib/actions/events/access'
import { ComingSoon } from '@/components/ui/coming-soon'


export default async function ChapterEventDetailPage({
  params,
}: {
  params: Promise<{ id: string, locale: string }>
}) {
  const { id, locale } = await params
  const access = await assertCanManageEvent(id)
  const supabase = 'error' in access ? null : access.supabase

  const { data: event } = supabase
    ? await supabase
        .from('event')
        .select('id, title, description, cover_image, start_at, end_at, location, meeting_url, event_type, capacity, is_published, chapter_id, created_by_id, created_at, updated_at, access_model, application_form_url, location_name, location_address, location_city, location_region, location_latitude, location_longitude')
        .eq('id', id)
        .maybeSingle<EventRow>()
    : { data: null }

  let editorChapter: ChapterRow | null = null
  if (supabase && event?.chapter_id) {
    const { data: chapter } = await supabase
      .from('chapter')
      .select('id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point')
      .eq('id', event.chapter_id)
      .maybeSingle()

    editorChapter = chapter
  }

  const { data: applicationQuestions } = supabase
    ? await supabase
        .from('event_application_question')
        .select('*')
        .eq('event_id', id)
        .order('sort_order', { ascending: true })
    : { data: [] }

  const { data: pathwayMetadata } = supabase
    ? await supabase
        .from('event_pathway_metadata')
        .select('*')
        .eq('event_id', id)
        .maybeSingle<EventPathwayMetadataRow>()
    : { data: null }

  const archiveAccess = event
    ? await assertCanAccessEvent(id, 'chapter.events.archive')
    : null
  const canArchiveEvents = Boolean(archiveAccess && !('error' in archiveAccess))

  if (!event) {
    return (
      <MainContainer className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Icons.Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Evento no encontrado</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Este evento puede haber sido eliminado o tu capítulo no tiene acceso para gestionarlo.
            </p>
            <Button asChild className="mt-6">
              <Link href={`/${locale}/chapter/events`}>Volver a eventos</Link>
            </Button>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  return (
    <ComingSoon
      title="Algo grande se está cocinando"
      description="Edita los detalles, revisa postulaciones y prepara el check-in de tu evento."
    >
      <MainContainer className="py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Resumen', href: `/${locale}/chapter` },
            { label: 'Eventos', href: `/${locale}/chapter/events` },
            { label: 'Editar evento' },
          ]}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Editar evento</h1>
              <Badge variant={event.is_published ? 'success' : 'outline'}>
                {event.is_published ? 'Publicado' : 'Borrador'}
              </Badge>
            </div>
            <p className="max-w-2xl text-muted-foreground">
              {event.title}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}/chapter/events`}>
                <Icons.ArrowLeft className="mr-2 h-4 w-4" />
                Eventos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/chapter/events/${event.id}/checkin`}>
                Check-in
              </Link>
            </Button>
          </div>
        </div>

        <EventForm
          mode="edit"
          initial={event}
          editorChapter={editorChapter}
          canArchiveEvents={canArchiveEvents}
          applicationQuestions={(applicationQuestions ?? []) as EventApplicationQuestionRow[]}
          pathwayMetadata={pathwayMetadata}
        />
      </MainContainer>
    </ComingSoon>
  )
}

