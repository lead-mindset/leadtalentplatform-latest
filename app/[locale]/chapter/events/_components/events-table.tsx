'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, EllipsisVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { updateEvent } from '@/lib/actions/events/update-event'
import { deleteEvent } from '@/lib/actions/events/delete-event'
import type { EventWithDetails } from '@/lib/types'
import { useRouter } from 'next/navigation'
import LocalDate from './local_date'
import { Icons } from '@/components/ui/icons'
import { presentLaunchEventTitle } from '@/lib/launch-copy'

function ownershipLabel(event: EventWithDetails) {
  if (event.is_owned_by_chapter === false) {
    return { label: 'Colaborador', icon: Icons.Handshake }
  }
  return { label: 'Propio', icon: Icons.Crown }
}

type EventsTableProps = {
  publishedEvents: EventWithDetails[]
  draftEvents: EventWithDetails[]
  finalizedEvents: EventWithDetails[]
  canArchiveEvents: boolean
}

export function EventsTable({
  publishedEvents,
  draftEvents,
  finalizedEvents,
  canArchiveEvents,
}: EventsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [showAllFinalized, setShowAllFinalized] = useState(false)
  const router = useRouter()

  function onTogglePublish(event: EventWithDetails) {
    startTransition(async () => {
      const response = await updateEvent({ id: event.id, isPublished: !event.is_published })
      if ('error' in response) {
        toast.error(response.error)
        return
      }
      toast.success(response.event.is_published ? 'Evento publicado' : 'Evento movido a borrador')
      router.refresh()
    })
  }

  function onDelete(eventId: string) {
    startTransition(async () => {
      const response = await deleteEvent(eventId)
      if ('error' in response) {
        toast.error(response.error)
        return
      }
      toast.success('Evento eliminado')
      router.refresh()
    })
  }

  async function copyLink(eventId: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${eventId}`)
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const hasMoreFinalized = finalizedEvents.length > 5
  const visibleFinalized = showAllFinalized ? finalizedEvents : finalizedEvents.slice(0, 5)

  return (
    <div className="space-y-10">
      <SectionTable
        title="Publicados"
        count={publishedEvents.length}
        events={publishedEvents}
        emptyMessage="No hay eventos publicados próximos"
        isPending={isPending}
        canArchiveEvents={canArchiveEvents}
        onTogglePublish={onTogglePublish}
        onDelete={onDelete}
        copyLink={copyLink}
      >
        {(event) => (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/chapter/events/${event.id}`}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/events/${event.id}`}>Vista pública</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyLink(event.id)}>
              Copiar enlace
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onTogglePublish(event)}>
              Despublicar
            </DropdownMenuItem>
            {canArchiveEvents && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar ${presentLaunchEventTitle(event.title)}?`)) {
                      onDelete(event.id)
                    }
                  }}
                >
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </SectionTable>

      <SectionTable
        title="Borradores"
        count={draftEvents.length}
        events={draftEvents}
        emptyMessage="No hay eventos en borrador"
        isPending={isPending}
        canArchiveEvents={canArchiveEvents}
        onTogglePublish={onTogglePublish}
        onDelete={onDelete}
        copyLink={copyLink}
      >
        {(event) => (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/chapter/events/${event.id}`}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTogglePublish(event)}>
              Publicar
            </DropdownMenuItem>
            {canArchiveEvents && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar ${presentLaunchEventTitle(event.title)}?`)) {
                      onDelete(event.id)
                    }
                  }}
                >
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </SectionTable>

      <SectionTable
        title="Finalizados"
        count={finalizedEvents.length}
        events={visibleFinalized}
        emptyMessage="No hay eventos finalizados"
        isPending={isPending}
        canArchiveEvents={canArchiveEvents}
        onTogglePublish={onTogglePublish}
        onDelete={onDelete}
        copyLink={copyLink}
        footer={
          hasMoreFinalized ? (
            <div className="border-t border-border px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setShowAllFinalized(!showAllFinalized)}
              >
                {showAllFinalized ? (
                  <>Mostrar menos <ChevronUp className="ml-1 h-4 w-4" /></>
                ) : (
                  <>Mostrar todos ({finalizedEvents.length}) <ChevronDown className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            </div>
          ) : null
        }
      >
        {(event) => (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/events/${event.id}`}>Vista pública</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyLink(event.id)}>
              Copiar enlace
            </DropdownMenuItem>
          </>
        )}
      </SectionTable>
    </div>
  )
}

function SectionTable({
  title,
  count,
  events,
  emptyMessage,
  isPending,
  canArchiveEvents,
  onTogglePublish,
  onDelete,
  copyLink,
  children,
  footer,
}: {
  title: string
  count: number
  events: EventWithDetails[]
  emptyMessage: string
  isPending: boolean
  canArchiveEvents: boolean
  onTogglePublish: (event: EventWithDetails) => void
  onDelete: (eventId: string) => void
  copyLink: (eventId: string) => void
  children: (event: EventWithDetails) => React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title} ({count})</h2>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%] pl-4">Evento</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Postulaciones</TableHead>
                  <TableHead className="text-right pr-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    renderKebab={children(event)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {events.map((event) => (
              <MobileEventRow
                key={event.id}
                event={event}
                isPending={isPending}
                canArchiveEvents={canArchiveEvents}
                onDelete={onDelete}
                onTogglePublish={onTogglePublish}
                copyLink={copyLink}
              />
            ))}
          </div>

          {footer}
        </div>
      )}
    </section>
  )
}

function EventRow({
  event,
  renderKebab,
}: {
  event: EventWithDetails
  renderKebab: React.ReactNode
}) {
  const ownership = ownershipLabel(event)
  const OwnershipIcon = ownership.icon
  const registrations = event._count.registrations
  const pendingApplications = event._count?.pending_applications ?? 0
  const fillRate = event.capacity && event.capacity > 0
    ? Math.min(100, Math.round((registrations / event.capacity) * 100))
    : null

  return (
    <TableRow>
      <TableCell className="pl-4 align-top">
        <div className="min-w-0 space-y-2 max-w-md">
          <div className="flex min-w-0 items-center gap-2">
            <OwnershipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Link
              href={`/chapter/events/${event.id}`}
              className="truncate font-medium text-foreground hover:text-primary"
              title={event.title}
            >
              {presentLaunchEventTitle(event.title)}
            </Link>
          </div>
          <LocalDate isoString={event.start_at} />
          <Badge variant="outline" size="sm">
            {ownership.label}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            {event.capacity === null
              ? `${registrations} registrados`
              : `${registrations}/${event.capacity} registrados`}
          </p>
          {fillRate !== null ? (
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${fillRate}%` }} />
            </div>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="align-top">
        {event.access_model === 'application' ? (
          <Badge variant={pendingApplications > 0 ? 'warning' : 'outline'}>
            {pendingApplications} pendientes
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Registro abierto</span>
        )}
      </TableCell>
      <TableCell className="pr-4 align-top">
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {renderKebab}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

function MobileEventRow({
  event,
  isPending,
  canArchiveEvents,
  onDelete,
  onTogglePublish,
  copyLink,
}: {
  event: EventWithDetails
  isPending: boolean
  canArchiveEvents: boolean
  onDelete: (eventId: string) => void
  onTogglePublish: (event: EventWithDetails) => void
  copyLink: (eventId: string) => void
}) {
  const statusLabel = new Date(event.end_at) < new Date()
    ? 'Finalizado'
    : event.is_published
      ? 'Publicado'
      : 'Borrador'
  const ownership = ownershipLabel(event)
  const OwnershipIcon = ownership.icon
  const pendingApplications = event._count?.pending_applications ?? 0

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <OwnershipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="break-words font-medium" title={event.title}>{presentLaunchEventTitle(event.title)}</p>
          </div>
          <LocalDate isoString={event.start_at} />
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusLabel === 'Publicado' ? 'secondary' : statusLabel === 'Finalizado' ? 'neutral' : 'outline'}>
              {statusLabel}
            </Badge>
            <Badge variant="outline">{ownership.label}</Badge>
            {event.access_model === 'application' ? (
              <Badge variant={pendingApplications > 0 ? 'warning' : 'outline'}>
                {pendingApplications} pendientes
              </Badge>
            ) : null}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusLabel === 'Borrador' && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/chapter/events/${event.id}`}>Editar</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePublish(event)}>
                  Publicar
                </DropdownMenuItem>
                {canArchiveEvents && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar ${presentLaunchEventTitle(event.title)}?`)) {
                          onDelete(event.id)
                        }
                      }}
                    >
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
            {statusLabel === 'Publicado' && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/chapter/events/${event.id}`}>Editar</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/events/${event.id}`}>Vista pública</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyLink(event.id)}>
                  Copiar enlace
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTogglePublish(event)}>
                  Despublicar
                </DropdownMenuItem>
                {canArchiveEvents && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar ${presentLaunchEventTitle(event.title)}?`)) {
                          onDelete(event.id)
                        }
                      }}
                    >
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
            {statusLabel === 'Finalizado' && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/events/${event.id}`}>Vista pública</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyLink(event.id)}>
                  Copiar enlace
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground">
        {event.capacity === null
          ? `${event._count.registrations} registrados`
          : `${event._count.registrations}/${event.capacity} registrados`}
      </p>
    </div>
  )
}
