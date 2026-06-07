'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { EventShareButton } from '@/components/events/event-share-button'
import type { EventWithDetails } from '@/lib/types'
import { useRouter } from 'next/navigation'
import LocalDate from './local_date'
import { Icons } from '@/components/ui/icons'
import { presentLaunchEventTitle } from '@/lib/launch-copy'

function statusForEvent(event: EventWithDetails): {
  label: 'Borrador' | 'Publicado' | 'Finalizado'
  variant: 'outline' | 'secondary' | 'neutral'
} {
  const isPast = new Date(event.end_at) < new Date()
  if (isPast) return { label: 'Finalizado', variant: 'neutral' }
  return event.is_published
    ? { label: 'Publicado', variant: 'secondary' }
    : { label: 'Borrador', variant: 'outline' }
}

function ownershipLabel(event: EventWithDetails) {
  if (event.is_owned_by_chapter === false) {
    return { label: 'Colaborador', icon: Icons.Handshake }
  }

  return { label: 'Propio', icon: Icons.Crown }
}

export function EventsTable({
  events,
  canArchiveEvents,
}: {
  events: EventWithDetails[]
  canArchiveEvents: boolean
}) {
  const [isPending, startTransition] = useTransition()
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

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[34%] pl-4">Evento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Postulaciones</TableHead>
              <TableHead className="w-[30rem] text-right pr-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const status = statusForEvent(event)
              const ownership = ownershipLabel(event)
              const OwnershipIcon = ownership.icon
              const registrations = event._count.registrations
              const pendingApplications = event._count?.pending_applications ?? 0
              const fillRate = event.capacity && event.capacity > 0
                ? Math.min(100, Math.round((registrations / event.capacity) * 100))
                : null

              return (
                <TableRow key={event.id} className={status.label === 'Finalizado' ? 'bg-muted/10' : ''}>
                  <TableCell className="pl-4 align-top">
                    <div className="min-w-0 space-y-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <OwnershipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Link
                          href={`/chapter/events/${event.id}`}
                          className="truncate font-medium text-foreground hover:text-primary"
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
                    <Badge variant={status.variant}>{status.label}</Badge>
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
                    <div className="grid grid-cols-3 justify-end gap-2 xl:flex xl:flex-wrap">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/chapter/events/${event.id}`}>Editar</Link>
                      </Button>
                      {event.is_published ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/events/${event.id}`}>Vista publica</Link>
                        </Button>
                      ) : null}
                      {event.is_published ? (
                        <EventShareButton
                          eventId={event.id}
                          eventTitle={event.title}
                          mode="copy"
                          size="sm"
                          variant="outline"
                        />
                      ) : null}
                      {event.access_model === 'application' ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/chapter/events/${event.id}/applications`}>
                            Postulaciones
                          </Link>
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => onTogglePublish(event)}>
                        {event.is_published ? 'Despublicar' : 'Publicar'}
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
                      </Button>
                      {canArchiveEvents ? (
                        <DeleteEventButton
                          disabled={isPending}
                          eventTitle={presentLaunchEventTitle(event.title)}
                          onConfirm={() => onDelete(event.id)}
                          tone="destructive"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
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
          />
        ))}
      </div>
    </div>
  )
}

function MobileEventRow({
  event,
  isPending,
  canArchiveEvents,
  onDelete,
  onTogglePublish,
}: {
  event: EventWithDetails
  isPending: boolean
  canArchiveEvents: boolean
  onDelete: (eventId: string) => void
  onTogglePublish: (event: EventWithDetails) => void
}) {
  const status = statusForEvent(event)
  const ownership = ownershipLabel(event)
  const OwnershipIcon = ownership.icon
  const pendingApplications = event._count?.pending_applications ?? 0

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <OwnershipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="break-words font-medium">{presentLaunchEventTitle(event.title)}</p>
          </div>
          <LocalDate isoString={event.start_at} />
          <div className="flex flex-wrap gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="outline">{ownership.label}</Badge>
            {event.access_model === 'application' ? (
              <Badge variant={pendingApplications > 0 ? 'warning' : 'outline'}>
                {pendingApplications} pendientes
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {event.capacity === null
          ? `${event._count.registrations} registrados`
          : `${event._count.registrations}/${event.capacity} registrados`}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/chapter/events/${event.id}`}>Editar</Link>
        </Button>
        {event.is_published ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/events/${event.id}`}>Vista publica</Link>
          </Button>
        ) : null}
        {event.is_published ? (
          <EventShareButton
            eventId={event.id}
            eventTitle={event.title}
            mode="copy"
            size="sm"
            variant="outline"
          />
        ) : null}
        <Button asChild size="sm" variant="outline">
          <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
        </Button>
        {event.access_model === 'application' ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/chapter/events/${event.id}/applications`}>Postulaciones</Link>
          </Button>
        ) : null}
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => onTogglePublish(event)}>
          {event.is_published ? 'Despublicar' : 'Publicar'}
        </Button>
        {canArchiveEvents ? (
          <DeleteEventButton
            disabled={isPending}
            eventTitle={presentLaunchEventTitle(event.title)}
            onConfirm={() => onDelete(event.id)}
            tone="quiet"
          />
        ) : null}
      </div>
    </div>
  )
}

function DeleteEventButton({
  disabled,
  eventTitle,
  onConfirm,
  tone,
}: {
  disabled: boolean
  eventTitle: string
  onConfirm: () => void
  tone: 'destructive' | 'quiet'
}) {
  const isQuiet = tone === 'quiet'

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant={isQuiet ? 'outline' : 'destructive'}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          className={
            disabled
              ? 'pointer-events-none bg-muted! text-muted-foreground! hover:bg-muted!'
              : isQuiet
                ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                : undefined
          }
        >
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará {eventTitle}. Usa esta acción solo para eventos que ya no deben existir en las operaciones del capítulo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Mantener evento</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Eliminar evento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
