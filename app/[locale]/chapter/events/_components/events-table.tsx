'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateEvent } from '@/lib/actions/events/update-event'
import { deleteEvent } from '@/lib/actions/events/delete-event'
import type { EventWithDetails } from '@/lib/types'
import { useRouter } from 'next/navigation'
import LocalDate from './local_date'
import { Icons } from '@/components/ui/icons'

function statusForEvent(event: EventWithDetails): 'Draft' | 'Published' | 'Past' {
  const isPast = new Date(event.end_at) < new Date()
  if (isPast) return 'Past'
  return event.is_published ? 'Published' : 'Draft'
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
    <div className="space-y-3">
      {events.map((event) => {
        const status = statusForEvent(event)
        const registrations = event._count.registrations
        const fillRate = event.capacity && event.capacity > 0
          ? Math.min(100, Math.round((registrations / event.capacity) * 100))
          : null

        return (
          <div
            key={event.id}
            className={`rounded-lg border border-border/60 p-4 space-y-3 ${status === 'Past' ? 'opacity-75' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {event.is_owned_by_chapter !== undefined && (
                    <div className="flex items-center gap-1" title={event.is_owned_by_chapter ? "Your chapter owns this event" : "Your chapter is collaborating on this event"}>
                      {event.is_owned_by_chapter ? (
                        <div title="Your chapter owns this event">
                          <Icons.Crown className="h-4 w-4 text-primary" />
                        </div>
                      ) : (
                        <div title="Your chapter is collaborating on this event">
                          <Icons.Handshake className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <p className="font-semibold truncate">{event.title}</p>
                </div>
                <LocalDate isoString={event.start_at} />
              </div>
              <Badge variant={status === 'Published' ? 'secondary' : 'outline'}>{status}</Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {event.capacity === null
                    ? `${registrations} registrations`
                    : `${registrations}/${event.capacity} registrations`}
                </p>
                {event.is_owned_by_chapter !== undefined && !event.is_owned_by_chapter && (
                  <Badge variant="outline" className="text-xs">Collaborating</Badge>
                )}
              </div>
              {fillRate !== null && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${fillRate}%` }} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/chapter/events/${event.id}`}>Edit</Link>
              </Button>
              {event.access_model === 'application' && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/chapter/events/${event.id}/applications`}>
                    <Icons.Users className="w-4 h-4 mr-1" />
                    Applications ({event._count?.pending_applications || 0})
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => onTogglePublish(event)}>
                {event.is_published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
              </Button>
              <Button size="sm" variant="destructive" disabled={isPending} onClick={() => onDelete(event.id)}>
                Delete
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}