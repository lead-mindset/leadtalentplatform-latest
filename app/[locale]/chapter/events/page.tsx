import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { getChapterEventPermissionFlags, getChapterEvents } from '@/lib/actions/events/get-data'
import { EventsTable } from './_components/events-table'
import { Icons } from '@/components/ui/icons'
import { MainContainer } from '@/components/global/main-container'
import type { ElementType } from 'react'
import { PageHeader } from '@/components/ui/page-header'

function StatBlock({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string
  value: number
  helper: string
  icon: ElementType
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

export default async function ChapterEventsPage() {
  const events = await getChapterEvents()
  const permissions = await getChapterEventPermissionFlags()
  const now = new Date()
  const publishedEvents = events.filter(event => event.is_published && new Date(event.end_at) >= now)
  const draftEvents = events.filter(event => !event.is_published && new Date(event.end_at) >= now)
  const finalizedEvents = events.filter(event => new Date(event.end_at) < now)
  const pendingApplications = events.reduce(
    (total, event) => total + (event._count?.pending_applications ?? 0),
    0
  )
  const upcomingCheckins = events.filter(event => event.is_published && new Date(event.start_at) >= now).length

  return (
    <MainContainer className="w-full max-w-full py-8 space-y-8">
      <div className="space-y-5">
        <PageHeader
          title="Eventos del capítulo"
          description="Gestiona eventos propios y colaborativos asociados a tu capítulo. Revisa borradores, publica con intención y prepara el check-in antes del evento."
          actions={
            <Button asChild className="shrink-0">
            <Link href="/chapter/events/new">
              <Icons.Plus className="mr-2 h-4 w-4" />
              Crear evento
            </Link>
          </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock
            label="Publicados"
            value={publishedEvents.length}
            helper="Publicados y vigentes"
            icon={Icons.Calendar}
          />
          <StatBlock
            label="Borradores"
            value={draftEvents.length}
            helper="Necesitan revisión antes de publicar"
            icon={Icons.Edit}
          />
          <StatBlock
            label="Postulaciones"
            value={pendingApplications}
            helper="Decisiones pendientes"
            icon={Icons.FileText}
          />
          <StatBlock
            label="Check-in"
            value={upcomingCheckins}
            helper="Eventos publicados próximos"
            icon={Icons.Ticket}
          />
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Icons.Calendar className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Todavia no hay eventos</h2>
            <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-muted-foreground">
              Crea el primer evento del capítulo cuando tu equipo esté listo para recibir registros o postulaciones.
            </p>
            <Button asChild>
              <Link href="/chapter/events/new">
                <Icons.Plus className="mr-2 h-4 w-4" />
                Crear evento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EventsTable
          publishedEvents={publishedEvents}
          draftEvents={draftEvents}
          finalizedEvents={finalizedEvents}
          canArchiveEvents={permissions.canArchiveEvents}
        />
      )}
    </MainContainer>
  )
}

