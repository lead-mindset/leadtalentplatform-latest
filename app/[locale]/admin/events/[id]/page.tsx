import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/types'
import { AdminEventForm } from '../_components/admin-event-form'
import { getChapters } from '@/lib/actions/admin/create-chapter'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: event }, chaptersRes] = await Promise.all([
    supabase
      .from('event')
      .select('id, title, description, cover_image, start_at, end_at, location, meeting_url, event_type, capacity, is_published, chapter_id, created_by_id, created_at, updated_at, access_model, application_form_url, location_name, location_address, location_city, location_region, location_latitude, location_longitude')
      .eq('id', id)
      .maybeSingle<EventRow>(),
    getChapters(),
  ])

  const chapters = 'chapters' in chaptersRes ? chaptersRes.chapters : []

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          eyebrow="Administracion"
          title="Gestionar evento"
          description="Edita detalles, alcance de capitulo y publicacion."
          className="mb-0"
        />
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/events">Volver</Link>
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
          <CardTitle>{event?.title ?? 'Evento'}</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEventForm mode="edit" chapters={chapters} initial={event ?? null} />
        </CardContent>
      </Card>
    </div>
  )
}

