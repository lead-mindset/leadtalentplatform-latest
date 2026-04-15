'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Calendar, ExternalLink, MapPin, Users, Instagram, Map } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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

function getEventStatus(startAt: string, endAt: string): { status: string; message: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const now = Date.now()
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  
  if (now < start) {
    return { status: 'Upcoming', message: 'Registration is open for this upcoming event.', variant: 'default' }
  } else if (now >= start && now <= end) {
    return { status: 'Live Now', message: 'This event is currently in progress.', variant: 'secondary' }
  } else {
    const daysAgo = Math.floor((now - end) / (1000 * 60 * 60 * 24))
    if (daysAgo === 0) {
      return { status: 'Just Ended', message: 'This event ended today.', variant: 'outline' }
    } else if (daysAgo === 1) {
      return { status: 'Past Event', message: 'This event ended yesterday.', variant: 'outline' }
    } else {
      return { status: 'Past Event', message: `This event ended ${daysAgo} days ago.`, variant: 'outline' }
    }
  }
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

  const eventStatus = getEventStatus(event.startAt, event.endAt)
  const registrationClosed = eventStatus.status !== 'Upcoming'

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
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-28">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Banner/Image */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {event.coverImage ? (
                    <div className="relative w-full h-full">
                      <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Section */}
            {event.location && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium">{event.location}</div>
                  </div>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <Map className="h-12 w-12 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Event Title and Basic Info - Subtle */}
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">{event.title || 'Untitled Event'}</h1>
              
              {/* Date and Time */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-muted flex flex-col items-center justify-center p-1">
                  <div className="text-xs font-medium uppercase text-muted-foreground">{new Date(event.startAt).toLocaleString('en-US', { month: 'short' })}</div>
                  <div className="text-2xl font-bold">{new Date(event.startAt).getDate()}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-lg">{new Date(event.startAt).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(event.startAt)} - {formatDateTime(event.endAt)}
                  </div>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-lg flex items-center gap-2">
                      {event.location}
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Registration Section - Primary Focus */}
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant={eventStatus.variant} className="text-xs">{eventStatus.status}</Badge>
                <p className="text-sm text-muted-foreground">{eventStatus.message}</p>
                {eventStatus.status === 'Upcoming' && (
                  <p className="text-sm">Welcome! To join the event, please register below.</p>
                )}
                
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
                    ) : (
                      <Button
                        onClick={handlePrimaryAction}
                        disabled={isSubmitting || registrationClosed}
                        className="w-full"
                      >
                        {isSubmitting ? 'Processing...' : 'Register'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* About Event - Subtle */}
            <div className="space-y-4">
              <h2 className="font-semibold">About Event</h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {event.description ? (
                  <p className="whitespace-pre-line">{event.description}</p>
                ) : (
                  <p>No description available for this event.</p>
                )}
              </div>
            </div>

          </div>
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
