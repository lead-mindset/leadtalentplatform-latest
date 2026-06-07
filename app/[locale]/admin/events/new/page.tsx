import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminEventForm } from '../_components/admin-event-form'
import { getChapters } from '@/lib/actions/admin/create-chapter'
import { PageHeader } from '@/components/ui/page-header'

export default async function NewAdminEventPage() {
  const chaptersRes = await getChapters()
  const chapters = 'chapters' in chaptersRes ? chaptersRes.chapters : []

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          eyebrow="Administración"
          title="Nuevo evento"
          description="Crea un evento global o asociado a un capítulo."
          className="mb-0"
        />
        <Button asChild variant="outline">
          <Link href="/admin/events">Volver</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del evento</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEventForm mode="create" chapters={chapters} />
        </CardContent>
      </Card>
    </div>
  )
}

