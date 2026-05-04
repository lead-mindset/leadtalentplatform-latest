'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  Monitor,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventRegistrationCheckout } from '@/components/events/event-registration-checkout'
import { ApplyModal } from '@/components/events/apply-modal'
import { applyForEvent } from '@/lib/actions/events/register'
import { Link } from '@/i18n/routing'
import type { EventApplicationQuestionRow, EventWithDetails } from '@/lib/types'
import { MainContainer } from '@/components/global/main-container'

type MyRegistration = {
  id: string
  status: 'registered' | 'pending_review' | 'rejected' | 'cancelled' | 'attended'
  checked_in_at: string | null
} | null

type TimingStatus = {
  label: string
  message: string
  variant: 'success' | 'info' | 'live' | 'outline'
  isRegistrationClosed: boolean
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getEventTypeLabel(eventType: EventWithDetails['event_type']) {
  if (eventType === 'online') return 'Online'
  if (eventType === 'hybrid') return 'Hybrid'
  return 'In person'
}

function getEventTiming(event: EventWithDetails, isApplicationRequired: boolean): TimingStatus {
  const now = Date.now()
  const start = new Date(event.start_at).getTime()
  const end = new Date(event.end_at).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return {
      label: 'Date pending',
      message: 'The event schedule is not available yet.',
      variant: 'outline',
      isRegistrationClosed: true,
    }
  }

  if (now >= start && now <= end) {
    return {
      label: 'Live now',
      message: 'This event is currently in progress.',
      variant: 'live',
      isRegistrationClosed: true,
    }
  }

  if (now > end) {
    return {
      label: 'Past event',
      message: 'This event has concluded.',
      variant: 'outline',
      isRegistrationClosed: true,
    }
  }

  return {
    label: isApplicationRequired ? 'Application required' : 'Open registration',
    message: isApplicationRequired
      ? 'Submit an application for editor review before you can attend.'
      : 'Registration is open for this upcoming event.',
    variant: isApplicationRequired ? 'info' : 'success',
    isRegistrationClosed: false,
  }
}

function getLocationLabel(event: EventWithDetails) {
  if (event.event_type === 'online') return 'Online'
  return event.location_name || event.location || event.location_city || 'Location pending'
}

function getAvailability(event: EventWithDetails) {
  if (event.capacity === null) {
    return {
      label: 'Open capacity',
      variant: 'secondary' as const,
    }
  }

  const remaining = Math.max(0, event.capacity - event._count.registrations)
  if (remaining === 0) {
    return {
      label: 'Full',
      variant: 'destructive' as const,
    }
  }

  return {
    label: remaining === 1 ? '1 spot left' : `${remaining} spots left`,
    variant: remaining <= 10 ? 'warning' as const : 'secondary' as const,
  }
}

function getRegistrationBadge(myRegistration: MyRegistration) {
  if (!myRegistration) return null

  if (myRegistration.status === 'registered') {
    return { label: 'Registered', variant: 'success' as const }
  }
  if (myRegistration.status === 'pending_review') {
    return { label: 'Under review', variant: 'warning' as const }
  }
  if (myRegistration.status === 'rejected') {
    return { label: 'Not selected', variant: 'destructive' as const }
  }
  if (myRegistration.status === 'cancelled') {
    return { label: 'Cancelled', variant: 'outline' as const }
  }
  if (myRegistration.status === 'attended') {
    return { label: 'Attended', variant: 'success' as const }
  }

  return null
}

export function EventContent({
  event,
  myRegistration,
  applicationQuestions,
  isLoggedIn,
  hasBasicProfile,
  onboardingUrl,
}: {
  event: EventWithDetails | null
  myRegistration: MyRegistration
  applicationQuestions: EventApplicationQuestionRow[]
  isLoggedIn: boolean
  hasBasicProfile: boolean
  onboardingUrl: string
}) {
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationError, setApplicationError] = useState<string | null>(null)

  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <MainContainer className="pb-20 pt-12">
          <Card className="mx-auto max-w-xl">
            <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
              <div>
                <h1 className="text-lg font-semibold">Event not found</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This event may have been removed or is no longer public.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/events">Back to events</Link>
              </Button>
            </CardContent>
          </Card>
        </MainContainer>
      </main>
    )
  }

  const isApplicationRequired = event.access_model === 'application'
  const timing = getEventTiming(event, isApplicationRequired)
  const registrationClosed = timing.isRegistrationClosed
  const availability = getAvailability(event)
  const registrationBadge = getRegistrationBadge(myRegistration)

  const isPending = myRegistration?.status === 'pending_review'
  const isRejected = myRegistration?.status === 'rejected'
  const isRegistered = myRegistration?.status === 'registered' || myRegistration?.status === 'attended'
  const isCancelled = myRegistration?.status === 'cancelled'

  const handlePrimaryAction = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/events/${event.id}`)
      return
    }
    if (!hasBasicProfile) {
      router.push(onboardingUrl)
      return
    }
    if (isApplicationRequired) {
      setApplicationError(null)
      setShowApplyModal(true)
    }
  }

  const handleApplyConfirm = async (
    subscribeToHostChapters: boolean,
    applicationAnswers: Array<{ questionId: string; value: string | string[] | null }>
  ): Promise<boolean> => {
    setIsSubmitting(true)
    setApplicationError(null)
    try {
      const result = await applyForEvent(event.id, subscribeToHostChapters, applicationAnswers)
      if ('error' in result) {
        if (result.requiresOnboarding && result.onboardingPath) {
          router.push(result.onboardingPath)
        }
        setApplicationError(result.error)
        return false
      }
      router.refresh()
      setShowApplyModal(false)
      return true
    } finally {
      setIsSubmitting(false)
    }
  }

  const registeredCount = event._count.registrations
  const ownerChapterLabel = event.chapter?.name ?? event.owner_chapter?.name ?? 'LEAD'
  const collaborators = event.event_chapter
    ?.map((ec: { chapter: { id: string; name: string } | null }) => ec.chapter)
    .filter((chapter): chapter is { id: string; name: string } => Boolean(chapter)) ?? []

  const heroImageSrc =
    event.cover_image ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCPkIXdCnOC4xM_keP1HVTc8Nn_asHtEtsE3T3mkN8Dr3QDObO6BA_ppVqlJIOjEtv0dKqF4KMU1-fhBVeeVu3IXJeHu8VndjHef3GU9_jWWTgMaM292D6UJYbE5a_U0cvkFDiDGhTFm8THZlrg838_CIZKgIu5YgUAX7YVP9gXTVeR__XeheoSuPRYMbn2NDMzbAW30OW15MOIUgace6VZNCZ51xoLDKKL7SXJmeoAjaoD8u32pDMrs3HiE7HRqw5Cps0fVyH8KRJU'

  return (
    <main className="min-h-screen bg-background">
      <MainContainer className="space-y-8 pb-24 pt-8 md:pt-12">
        <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground hover:text-foreground">
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
        </Button>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={timing.variant}>{timing.label}</Badge>
                <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
                <Badge variant={availability.variant}>{availability.label}</Badge>
                {registrationBadge ? (
                  <Badge variant={registrationBadge.variant}>{registrationBadge.label}</Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                  {event.title || 'Untitled event'}
                </h1>
                <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                  {timing.message}
                </p>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[18rem_1fr]">
                <div className="relative min-h-64 bg-muted md:min-h-full">
                  <Image
                    src={heroImageSrc}
                    alt={event.cover_image ? event.title || 'Event cover' : ''}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                <CardContent className="space-y-5 p-5 md:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex gap-3">
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatDate(event.start_at)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.start_at)} - {formatTime(event.end_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {event.event_type === 'online' ? (
                        <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{getLocationLabel(event)}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {event.location_address || event.location_city || event.meeting_url || 'Details available from the host'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{ownerChapterLabel}</p>
                        <p className="text-sm text-muted-foreground">
                          {collaborators.length > 0
                            ? `${collaborators.length} collaborator${collaborators.length === 1 ? '' : 's'}`
                            : 'Host chapter'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Users className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {registeredCount} registered
                          {event.capacity !== null ? ` / ${event.capacity}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">{availability.label}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">About this event</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert md:prose-base">
                {event.description ? (
                  <p className="whitespace-pre-wrap">{event.description}</p>
                ) : (
                  <p>No description is available for this event yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">Hosted by</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ownerChapterLabel}</p>
                      <p className="text-sm text-muted-foreground">Host chapter</p>
                    </div>
                  </CardContent>
                </Card>

                {collaborators.map((chapter) => (
                  <Card key={chapter.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{chapter.name}</p>
                        <p className="text-sm text-muted-foreground">Collaborator</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-lg">
                  Registration
                  <Badge variant={timing.variant}>{timing.label}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{timing.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isApplicationRequired
                          ? 'Application answers are reviewed before registration is confirmed.'
                          : 'Registration creates your QR code for check-in.'}
                      </p>
                    </div>
                  </div>
                </div>

                {!isApplicationRequired ? (
                  <EventRegistrationCheckout
                    eventId={event.id}
                    eventTitle={event.title}
                    isLoggedIn={isLoggedIn}
                    hasBasicProfile={hasBasicProfile}
                    loginUrl={`/auth/login?next=/events/${event.id}`}
                    onboardingUrl={onboardingUrl}
                    registrationClosed={registrationClosed}
                    isRegistered={isRegistered}
                    hadCancelledRegistration={isCancelled}
                    canCancel={
                      myRegistration?.status === 'registered' &&
                      !myRegistration.checked_in_at &&
                      !registrationClosed
                    }
                    registrationId={myRegistration?.id ?? null}
                    capacity={event.capacity}
                    registeredCount={registeredCount}
                  />
                ) : (
                  <div className="space-y-3">
                    {isPending ? (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
                        Your application is under review. You will receive an email when a decision is made.
                      </div>
                    ) : null}

                    {isRejected ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        You were not selected for this event.
                      </div>
                    ) : null}

                    {isRegistered ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
                          You are registered for this event. Check your email or student events page for QR details.
                        </div>
                        <Button asChild className="w-full">
                          <Link href={`/student/events?event=${event.id}`}>View my QR code</Link>
                        </Button>
                      </div>
                    ) : isPending || isRejected ? null : (
                      <Button
                        size="lg"
                        onClick={handlePrimaryAction}
                        disabled={isSubmitting || registrationClosed}
                        className="w-full"
                      >
                        {isSubmitting ? 'Processing...' : isLoggedIn ? 'Apply now' : 'Sign in to apply'}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}

                    {!isLoggedIn ? (
                      <p className="text-xs text-muted-foreground">
                        You will be sent to sign in before applying.
                      </p>
                    ) : !hasBasicProfile ? (
                      <p className="text-xs text-muted-foreground">
                        Complete onboarding once before applying to LEAD events.
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>

        {isApplicationRequired ? (
          <ApplyModal
            open={showApplyModal}
            onOpenChange={setShowApplyModal}
            eventTitle={event.title}
            applicationFormUrl={event.application_form_url || ''}
            questions={applicationQuestions}
            submissionError={applicationError}
            onConfirm={handleApplyConfirm}
            isSubmitting={isSubmitting}
          />
        ) : null}
      </MainContainer>
    </main>
  )
}
