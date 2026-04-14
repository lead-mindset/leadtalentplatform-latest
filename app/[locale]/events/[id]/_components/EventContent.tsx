'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Calendar, ExternalLink, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { EventRegistrationCheckout } from '@/components/events/event-registration-checkout'
import { ApplyModal } from '@/components/events/apply-modal'
import { RegistrationStatusBadge } from '@/components/events/registration-status-badge'
import { applyForEvent } from '@/lib/actions/events/register'
import type { EventWithDetails } from '@/lib/types'

type MyRegistration = {
  id: string
  status: 'registered' | 'pending_review' | 'rejected' | 'cancelled' | 'attended'
  checkedInAt: string | null
} | null

function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const label =
    eventType === 'online' ? 'Online' : eventType === 'hybrid' ? 'Hybrid' : 'In-person'
  return <Badge variant="secondary">{label}</Badge>
}

function capacityHint(
  capacity: number | null,
  registeredCount: number,
  eventStarted: boolean
) {
  if (eventStarted || capacity === null) return null
  const left = capacity - registeredCount
  if (left <= 0) return 'This event is at capacity.'
  if (left <= 10) return left === 1 ? '1 spot left' : `${left} spots left`
  return null
}

export function EventContent({
  event,
  myRegistration,
  isLoggedIn,
}: {
  event: EventWithDetails | null
  myRegistration: MyRegistration
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Event not found.
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const now = Date.now()
  const startsAt = new Date(event.startAt).getTime()
  const registrationClosed = Number.isFinite(startsAt) ? now >= startsAt : false

  const isApplicationRequired = event.accessModel === 'application'
  const isPending = myRegistration?.status === 'pending_review'
  const isRejected = myRegistration?.status === 'rejected'
  const isRegistered = myRegistration?.status === 'registered'
  const isCancelled = myRegistration?.status === 'cancelled'

  const handlePrimaryAction = () => {
    if (isApplicationRequired) {
      setShowApplyModal(true)
    }
  }

  const handleApplyConfirm = async () => {
    setIsSubmitting(true)
    try {
      await applyForEvent(event.id)
      router.refresh()
      setShowApplyModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const registeredCount = event._count.registrations
  const capHint = capacityHint(event.capacity, registeredCount, registrationClosed)
  const chapterLabel = event.Chapter
    ? `${event.Chapter.name} / ${event.Chapter.university}`
    : 'Global'

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-6 px-6 pb-16 pt-28">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <EventTypeBadge eventType={event.eventType} />
              {event.accessModel === 'application' ? (
                <Badge variant="secondary">Application Required</Badge>
              ) : null}
              {event.capacity !== null ? (
                <Badge variant="outline" className="tabular-nums">
                  {registeredCount}/{event.capacity}
                </Badge>
              ) : null}
              {!event.isPublished ? <Badge variant="destructive">Draft</Badge> : null}
              {myRegistration ? <RegistrationStatusBadge status={myRegistration.status} /> : null}
            </div>

            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <p className="text-sm text-muted-foreground">
              {chapterLabel}
              {event.CreatedBy?.name ? ` / Created by ${event.CreatedBy.name}` : ''}
            </p>
          </div>

          {isApplicationRequired && !isRegistered && !isPending && !isRejected ? (
            <Button
              onClick={handlePrimaryAction}
              disabled={isSubmitting || registrationClosed}
            >
              {isSubmitting ? 'Processing...' : 'Apply'}
            </Button>
          ) : null}

          <Button asChild variant="outline">
            <Link href="/events">Back to events</Link>
          </Button>
        </div>

        {event.coverImage ? (
          <Card className="overflow-hidden">
            <div className="relative h-56 w-full bg-muted">
              <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
            </div>
          </Card>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No description provided.</p>
              )}

              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {formatDateTime(event.startAt)} - {formatDateTime(event.endAt)}
                  </span>
                </div>

                {event.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>
                    {registeredCount} registered
                    {event.capacity !== null ? ` / ${event.capacity} capacity` : ''}
                  </span>
                </div>

                {capHint ? <p className="pl-6 text-sm text-muted-foreground">{capHint}</p> : null}

                {event.meetingUrl ? (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-primary transition-opacity hover:opacity-70"
                    >
                      {event.meetingUrl}
                    </a>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent>
              {!isApplicationRequired ? (
                <EventRegistrationCheckout
                  eventId={event.id}
                  eventTitle={event.title}
                  isLoggedIn={isLoggedIn}
                  loginUrl={`/auth/login?next=/events/${event.id}`}
                  registrationClosed={registrationClosed}
                  isRegistered={isRegistered}
                  hadCancelledRegistration={isCancelled}
                  canCancel={
                    myRegistration?.status === 'registered' &&
                    !myRegistration.checkedInAt &&
                    !registrationClosed
                  }
                  registrationId={myRegistration?.id ?? null}
                  capacity={event.capacity}
                  registeredCount={registeredCount}
                />
              ) : (
                <div className="space-y-4">
                  {isPending ? (
                    <div className="rounded-lg border bg-muted/40 p-4">
                      <p className="text-sm text-muted-foreground">
                        Your application is under review. You&apos;ll receive an email when a
                        decision is made.
                      </p>
                    </div>
                  ) : null}

                  {isRejected ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                      <p className="text-sm text-destructive">Not selected for this event.</p>
                    </div>
                  ) : null}

                  {isRegistered ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm text-foreground">
                        You&apos;re registered for this event. Check your email for QR code details.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isApplicationRequired ? (
        <ApplyModal
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
          eventTitle={event.title}
          applicationFormUrl={event.applicationFormUrl || ''}
          onConfirm={handleApplyConfirm}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </main>
  )
}
