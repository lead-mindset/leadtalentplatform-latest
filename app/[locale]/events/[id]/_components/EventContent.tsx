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
  ExternalLink,
  MapPinned,
  Monitor,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EventCalendarActions } from '@/components/events/event-calendar-actions'
import { EventRegistrationCheckout } from '@/components/events/event-registration-checkout'
import { EventShareButton } from '@/components/events/event-share-button'
import { ApplyModal } from '@/components/events/apply-modal'
import { applyForEvent } from '@/lib/actions/events/register'
import { Link } from '@/i18n/routing'
import type { EventApplicationQuestionRow, EventWithDetails } from '@/lib/types'
import { MainContainer } from '@/components/global/main-container'
import { getEventLifecycle } from '@/lib/events/lifecycle'

type MyRegistration = {
  id: string
  status: 'registered' | 'pending_review' | 'rejected' | 'cancelled' | 'attended'
  checked_in_at: string | null
} | null

const SPANISH_WEEKDAYS = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
]
const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const SPANISH_SHORT_MONTHS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OCT',
  'NOV',
  'DIC',
]

function getLimaParts(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const limaDate = new Date(date.getTime() - 5 * 60 * 60 * 1000)
  const hours = limaDate.getUTCHours()

  return {
    weekday: SPANISH_WEEKDAYS[limaDate.getUTCDay()],
    month: SPANISH_MONTHS[limaDate.getUTCMonth()],
    shortMonth: SPANISH_SHORT_MONTHS[limaDate.getUTCMonth()],
    day: limaDate.getUTCDate(),
    year: limaDate.getUTCFullYear(),
    hour12: hours % 12 || 12,
    minute: String(limaDate.getUTCMinutes()).padStart(2, '0'),
    dayPeriod: hours < 12 ? 'a. m.' : 'p. m.',
  }
}

function formatDate(value: string) {
  const parts = getLimaParts(value)
  if (!parts) return value

  return `${parts.weekday}, ${parts.day} de ${parts.month} de ${parts.year}`
}

function formatTime(value: string) {
  const parts = getLimaParts(value)
  if (!parts) return value

  return `${parts.hour12}:${parts.minute} ${parts.dayPeriod}`
}

function formatDateBadge(value: string) {
  const parts = getLimaParts(value)
  if (!parts) return { month: 'TBD', day: '--' }

  return {
    month: parts.shortMonth,
    day: String(parts.day),
  }
}

function getEventTypeLabel(eventType: EventWithDetails['event_type']) {
  if (eventType === 'online') return 'En linea'
  if (eventType === 'hybrid') return 'Hibrido'
  return 'Presencial'
}

function getLocationLabel(event: EventWithDetails) {
  if (event.event_type === 'online') return 'En linea'
  return event.location_name || event.location || event.location_city || 'Ubicacion pendiente'
}

function getAvailability(event: EventWithDetails) {
  if (event.capacity === null) {
    return {
      label: 'Cupos abiertos',
      variant: 'success' as const,
    }
  }

  const remaining = Math.max(0, event.capacity - event._count.registrations)
  if (remaining === 0) {
    return {
      label: 'Lleno',
      variant: 'destructive' as const,
    }
  }

  return {
    label: remaining === 1 ? 'Queda 1 cupo' : `Quedan ${remaining} cupos`,
    variant: remaining <= 10 ? 'warning' as const : 'neutral' as const,
  }
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
                <h1 className="text-lg font-semibold">Evento no encontrado</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Este evento puede haber sido eliminado o ya no esta publico.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/events">Volver a eventos</Link>
              </Button>
            </CardContent>
          </Card>
        </MainContainer>
      </main>
    )
  }

  const isApplicationRequired = event.access_model === 'application'
  const availability = getAvailability(event)
  const eventLifecycle = getEventLifecycle({
    startAt: event.start_at,
    endAt: event.end_at,
    accessModel: event.access_model === 'application' ? 'application' : 'open',
    capacity: event.capacity,
    registeredCount: event._count.registrations,
  })
  const userLifecycle = myRegistration
    ? getEventLifecycle({
        startAt: event.start_at,
        endAt: event.end_at,
        accessModel: event.access_model === 'application' ? 'application' : 'open',
        capacity: event.capacity,
        registeredCount: event._count.registrations,
        registrationStatus: myRegistration.status,
        checkedInAt: myRegistration.checked_in_at,
      })
    : null
  const registrationClosed = ['live', 'past', 'date_pending'].includes(eventLifecycle.state)
  const isFull = eventLifecycle.state === 'full'

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
  const detailUrl = `/es/events/${event.id}`
  const calendarLocation = event.event_type === 'online'
    ? event.meeting_url || 'En linea'
    : event.location_address || event.location_name || event.location || event.location_city
  const locationName = getLocationLabel(event)
  const locationDetail = event.location_address || event.location_city || event.meeting_url || 'Detalles disponibles con el organizador'
  const mapAddress = event.location_address || event.location || event.location_city || locationName
  const mapQuery = event.event_type === 'online' ? null : [locationName, mapAddress].filter(Boolean).join(', ')
  const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null
  const mapExternalUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null
  const calendarEvent = {
    title: event.title || 'Evento LEAD',
    startAt: event.start_at,
    endAt: event.end_at,
    location: calendarLocation,
    meetingUrl: event.meeting_url,
    detailUrl,
    description: event.description,
  }
  const collaborators = event.event_chapter
    ?.map((ec: { chapter: { id: string; name: string } | null }) => ec.chapter)
    .filter((chapter): chapter is { id: string; name: string } => Boolean(chapter)) ?? []
  const dateBadge = formatDateBadge(event.start_at)

  return (
    <main className="min-h-screen bg-background">
      <MainContainer className="space-y-8 pb-24 pt-6 md:pt-10">
        <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground hover:text-foreground">
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
            Volver a eventos
          </Link>
        </Button>

        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
          <aside className="order-2 space-y-5 lg:sticky lg:top-20 lg:order-1">
            <div className="overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm">
              <div className="relative aspect-square bg-muted">
                {event.cover_image ? (
                  <Image
                    src={event.cover_image}
                    alt={event.title || 'Imagen del evento'}
                    fill
                    sizes="(min-width: 1024px) 22rem, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_18%_14%,hsl(var(--primary)/0.3),transparent_34%),linear-gradient(145deg,hsl(var(--muted)),hsl(var(--card)))] p-6">
                    <Badge variant="outline" className="w-fit bg-background/70 backdrop-blur">
                      Evento LEAD
                    </Badge>
                    <CalendarDays className="h-14 w-14 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Evento para la comunidad</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">{getEventTypeLabel(event.event_type)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <section className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Hosted by</p>
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{ownerChapterLabel}</p>
                    <p className="text-xs text-muted-foreground">Capitulo anfitrion</p>
                  </div>
                </div>

                {collaborators.map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{chapter.name}</p>
                      <p className="text-xs text-muted-foreground">Colaborador</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline"># {getEventTypeLabel(event.event_type)}</Badge>
              {userLifecycle ? <Badge variant={userLifecycle.badgeVariant}># {userLifecycle.label}</Badge> : null}
            </div>
          </aside>

          <div className="order-1 space-y-7 lg:order-2">
            <section className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={eventLifecycle.badgeVariant}>{eventLifecycle.label}</Badge>
                <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">{ownerChapterLabel}</p>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
                  {event.title || 'Evento sin titulo'}
                </h1>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/35 text-center">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">{dateBadge.month}</span>
                    <span className="text-lg font-semibold leading-none">{dateBadge.day}</span>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-medium">{formatDate(event.start_at)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatTime(event.start_at)} - {formatTime(event.end_at)} GMT-5
                    </p>
                    <EventCalendarActions
                      event={calendarEvent}
                      className="mt-3"
                      buttonClassName="h-9 px-3"
                      googleLabel="Agregar a calendario"
                      showDownload={false}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/35">
                    {event.event_type === 'online' ? (
                      <Monitor className="h-5 w-5 text-primary" />
                    ) : (
                      <MapPinned className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-medium">{locationName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{locationDetail}</p>
                  </div>
                </div>
              </div>
            </section>

            <Card className="overflow-hidden border-primary/10">
              <div className="border-b bg-muted/25 px-5 py-3 text-sm font-medium text-muted-foreground">
                Registration
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{eventLifecycle.label}</p>
                      <Badge variant={availability.variant}>{availability.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isApplicationRequired
                        ? 'Envia tu postulacion y el equipo anfitrion revisara tus respuestas.'
                        : 'Registrate para recibir tu codigo QR de check-in.'}
                    </p>
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
                    startAt={event.start_at}
                    endAt={event.end_at}
                    location={calendarLocation}
                    meetingUrl={event.meeting_url}
                    detailUrl={detailUrl}
                    description={event.description}
                  />
                ) : (
                  <div className="space-y-3">
                    {isPending ? (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
                        Tu postulacion esta en revision. Recibiras un correo cuando haya una decision.
                      </div>
                    ) : null}

                    {isRejected ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        No fuiste seleccionado para este evento.
                      </div>
                    ) : null}

                    {isRegistered ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
                          Ya estas registrado en este evento. Revisa tu correo o la pagina de mis eventos para ver el QR.
                        </div>
                        <Button asChild className="w-full">
                          <Link href={`/student/events?event=${event.id}`}>Ver mi codigo QR</Link>
                        </Button>
                      </div>
                    ) : isPending || isRejected ? null : (
                      <Button
                        size="lg"
                        onClick={handlePrimaryAction}
                        disabled={isSubmitting || registrationClosed || isFull}
                        className="w-full"
                      >
                        {isSubmitting ? 'Procesando...' : isLoggedIn ? 'Postular ahora' : 'Inicia sesion para postular'}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}

                    {!isLoggedIn ? (
                      <p className="text-xs text-muted-foreground">
                        Te enviaremos a iniciar sesion antes de postular.
                      </p>
                    ) : !hasBasicProfile ? (
                      <p className="text-xs text-muted-foreground">
                        Completa el onboarding una vez antes de postular a eventos LEAD.
                      </p>
                    ) : null}
                  </div>
                )}

                <EventShareButton
                  eventId={event.id}
                  eventTitle={event.title}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">About Event</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert md:prose-base">
                {event.description ? (
                  <p className="whitespace-pre-wrap">{event.description}</p>
                ) : (
                  <p>Aun no hay descripcion disponible para este evento.</p>
                )}
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Ubicacion</h2>
                  <p className="mt-3 text-lg font-semibold">{locationName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{locationDetail}</p>
                </div>
                {mapExternalUrl ? (
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <a href={mapExternalUrl} target="_blank" rel="noreferrer">
                      Abrir mapa
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>

              {mapEmbedUrl ? (
                <div className="overflow-hidden rounded-xl border bg-muted shadow-sm">
                  <iframe
                    title={`Mapa de ${locationName}`}
                    src={mapEmbedUrl}
                    className="h-64 w-full border-0 md:h-80"
                    loading="eager"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-start gap-3 p-4">
                    <Monitor className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Evento en linea</p>
                      <p className="text-sm text-muted-foreground">{locationDetail}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

          </div>
        </section>

        {isApplicationRequired ? (
          <ApplyModal
            open={showApplyModal}
            onOpenChange={setShowApplyModal}
            eventTitle={event.title}
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
