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
import type { EventWithDetails } from '@/lib/types'
import { useRouter } from 'next/navigation'
import LocalDate from './local_date'
import { Icons } from '@/components/ui/icons'

function statusForEvent(event: EventWithDetails): {
  label: 'Draft' | 'Published' | 'Past'
  variant: 'outline' | 'secondary' | 'neutral'
} {
  const isPast = new Date(event.end_at) < new Date()
  if (isPast) return { label: 'Past', variant: 'neutral' }
  return event.is_published
    ? { label: 'Published', variant: 'secondary' }
    : { label: 'Draft', variant: 'outline' }
}

function ownershipLabel(event: EventWithDetails) {
  if (event.is_owned_by_chapter === false) {
    return { label: 'Collaborating', icon: Icons.Handshake }
  }

  return { label: 'Owned', icon: Icons.Crown }
}

export function EventsTable({ events }: { events: EventWithDetails[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function onTogglePublish(event: EventWithDetails) {
    startTransition(async () => {
      const response = await updateEvent({ id: event.id, isPublished: !event.is_published })
      if ('error' in response) {
        toast.error(response.error)
        return
      }
      toast.success(response.event.is_published ? 'Event published' : 'Event moved to draft')
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
      toast.success('Event deleted')
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[36%] pl-4">Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
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
                <TableRow key={event.id} className={status.label === 'Past' ? 'opacity-75' : ''}>
                  <TableCell className="pl-4 align-top">
                    <div className="min-w-0 space-y-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <OwnershipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Link
                          href={`/chapter/events/${event.id}`}
                          className="truncate font-medium text-foreground hover:text-primary"
                        >
                          {event.title}
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
                          ? `${registrations} registered`
                          : `${registrations}/${event.capacity} registered`}
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
                        {pendingApplications} pending
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Open registration</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 align-top">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/chapter/events/${event.id}`}>Edit</Link>
                      </Button>
                      {event.access_model === 'application' ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/chapter/events/${event.id}/applications`}>
                            Applications
                          </Link>
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => onTogglePublish(event)}>
                        {event.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
                      </Button>
                      <DeleteEventButton
                        disabled={isPending}
                        eventTitle={event.title}
                        onConfirm={() => onDelete(event.id)}
                      />
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
  onDelete,
  onTogglePublish,
}: {
  event: EventWithDetails
  isPending: boolean
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
            <p className="break-words font-medium">{event.title}</p>
          </div>
          <LocalDate isoString={event.start_at} />
          <div className="flex flex-wrap gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="outline">{ownership.label}</Badge>
            {event.access_model === 'application' ? (
              <Badge variant={pendingApplications > 0 ? 'warning' : 'outline'}>
                {pendingApplications} pending
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {event.capacity === null
          ? `${event._count.registrations} registered`
          : `${event._count.registrations}/${event.capacity} registered`}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/chapter/events/${event.id}`}>Edit</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
        </Button>
        {event.access_model === 'application' ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/chapter/events/${event.id}/applications`}>Applications</Link>
          </Button>
        ) : null}
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => onTogglePublish(event)}>
          {event.is_published ? 'Unpublish' : 'Publish'}
        </Button>
        <DeleteEventButton
          disabled={isPending}
          eventTitle={event.title}
          onConfirm={() => onDelete(event.id)}
        />
      </div>
    </div>
  )
}

function DeleteEventButton({
  disabled,
  eventTitle,
  onConfirm,
}: {
  disabled: boolean
  eventTitle: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={disabled}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete event?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete {eventTitle}. This action should only be used for events that should no
            longer exist in chapter operations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep event</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
