'use client'

import { useState, Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { useRouter } from 'next/navigation'
import { Navbar } from '../../(public)/_components/navbar'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/actions/events/get-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { EventRegistrationCheckout } from '@/components/events/event-registration-checkout'
import { ApplyModal } from '@/components/events/apply-modal'
import { RegistrationStatusBadge } from '@/components/events/registration-status-badge'
import { applyForEvent } from '@/lib/actions/events/register'

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

async function EventContent({ id }: { id: string }) {
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  noStore()
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const event = await getEventById(id)
  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 pt-28 pb-16">
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

  let myRegistration: { id: string; status: 'registered' | 'pending_review' | 'rejected' | 'cancelled' | 'attended'; checkedInAt: string | null } | null = null
  if (auth.user) {
    const { data, error: regError } = await supabase
      .from('EventRegistration')
      .select('id, status, checkedInAt')
      .eq('eventId', event.id)
      .eq('userId', auth.user.id)
      .maybeSingle()

    if (regError) {
      console.error('[EventContent] EventRegistration lookup:', regError)
    }
    myRegistration = data ?? null
  }

  const isApplicationRequired = event?.accessModel === 'application'
  const isPending = myRegistration?.status === 'pending_review'
  const isRejected = myRegistration?.status === 'rejected'
  const isRegistered = myRegistration?.status === 'registered'
  const isCancelled = myRegistration?.status === 'cancelled'

  const handlePrimaryAction = async () => {
    if (!event) return
    if (isApplicationRequired) {
      setShowApplyModal(true)
      return
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

  const getButtonConfig = () => {
    if (isRegistered) {
      return { label: 'Registered ✓', disabled: true, variant: 'secondary' }
    }
    if (isPending) {
      return { label: 'Application Under Review', disabled: true, variant: 'secondary' }
    }
    if (isRejected) {
      return { label: 'Not Selected', disabled: true, variant: 'secondary' }
    }
    if (isApplicationRequired) {
      return { label: 'Apply', disabled: false, variant: 'default' }
    }
    return { label: 'Register', disabled: false, variant: 'default' }
  }

  const buttonConfig = getButtonConfig()

  const registeredCount = event._count.registrations
  const capHint = capacityHint(event.capacity, registeredCount, registrationClosed)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <EventTypeBadge eventType={event.eventType} />
              {event.accessModel === 'application' && (
                <Badge variant="secondary" className="bg-amber-500/90 text-white">
                  Application Required
                </Badge>
              )}
              {event.capacity !== null && (
                <Badge variant="outline" className="tabular-nums">
                  {registeredCount}/{event.capacity}
                </Badge>
              )}
              {!event.isPublished && <Badge variant="destructive">Draft</Badge>}
              {myRegistration && (
                <RegistrationStatusBadge status={myRegistration.status} />
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <p className="text-sm text-muted-foreground">
              {event.Chapter ? `${event.Chapter.name} · ${event.Chapter.university}` : 'Global'}
              {event.CreatedBy?.name ? ` · Created by ${event.CreatedBy.name}` : ''}
            </p>
          </div>

          {/* Apply Button for Application-Gated Events */}
          {isApplicationRequired && !isRegistered && !isPending && !isRejected && (
            <Button
              onClick={handlePrimaryAction}
              disabled={isSubmitting || registrationClosed}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? 'Processing...' : 'Apply'}
            </Button>
          )}

          <Button asChild variant="outline">
            <Link href="/events">Back to events</Link>
          </Button>
        </div>

        {event.coverImage && (
          <Card className="overflow-hidden">
            <div className="relative h-56 w-full bg-muted">
              <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {event.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No description provided.</p>
              )}

              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {formatDateTime(event.startAt)} — {formatDateTime(event.endAt)}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>
                    {registeredCount} registered
                    {event.capacity !== null ? ` · ${event.capacity} capacity` : ''}
                  </span>
                </div>
                {capHint ? (
                  <p className="text-sm text-amber-600 dark:text-amber-500 pl-6">{capHint}</p>
                ) : null}
                {event.meetingUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:opacity-70 transition-opacity break-all"
                    >
                      {event.meetingUrl}
                    </a>
                  </div>
                )}
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
                  isLoggedIn={!!auth.user}
                  loginUrl={`/auth/login?next=/events/${event.id}`}
                  registrationClosed={registrationClosed}
                  isRegistered={isRegistered}
                  hadCancelledRegistration={isCancelled}
                  canCancel={myRegistration?.status === 'registered' && !myRegistration.checkedInAt && !registrationClosed}
                  registrationId={myRegistration?.id ?? null}
                  capacity={event.capacity}
                  registeredCount={registeredCount}
                />
              ) : (
                <div className="space-y-4">
                  {isPending && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Your application is under review. You'll receive an email when a decision is made.
                      </p>
                    </div>
                  )}
                  {isRejected && (
                    <div className="bg-neutral-500/10 border border-neutral-500/20 rounded-lg p-4">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Not selected for this event.
                      </p>
                    </div>
                  )}
                  {isRegistered && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        You're registered for this event! Check your email for QR code details.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {event && isApplicationRequired && (
        <ApplyModal
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
          eventTitle={event.title}
          applicationFormUrl={event.applicationFormUrl || ''}
          onConfirm={handleApplyConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <EventContent id={id} />
      </Suspense>
    </>
  )
}
