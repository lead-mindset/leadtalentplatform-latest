import QRCode from 'qrcode'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { BookOpenCheck, QrCode } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMyRegistrations } from '@/lib/actions/events/get-data'
import { CancelRegistrationDialog } from '@/components/events/cancel-registration-dialog'
import { EventCalendarActions } from '@/components/events/event-calendar-actions'
import { EventDayGuidance } from '@/components/events/event-day-guidance'
import { ScrollToHighlightedEvent } from '@/components/events/scroll-to-highlighted-event'
import { RegistrationStatusBadge } from '@/components/events/registration-status-badge'
import type { RegistrationStatus } from '@/lib/types'
import { Link } from '@/i18n/routing'
import { Icons } from '@/components/ui/icons'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { getEventLifecycle } from '@/lib/events/lifecycle'

type RegistrationWithEvent = Awaited<ReturnType<typeof getMyRegistrations>>[number]

type EventRegistrationCardProps = {
  registration: RegistrationWithEvent
  qrDataUrl: string | null
  showQr?: boolean
}

function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value

  return d.toLocaleString('es-PE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function isFutureEvent(registration: RegistrationWithEvent) {
  if (!registration.event?.start_at) return false
  return new Date(registration.event.start_at) > new Date()
}

function isCheckedIn(registration: RegistrationWithEvent) {
  return Boolean(registration.checked_in_at) || registration.status === 'attended'
}

function canReflectOnEvent(registration: RegistrationWithEvent) {
  if (isCheckedIn(registration)) return true
  if (registration.status !== 'registered') return false
  if (!registration.event?.start_at) return false
  return new Date(registration.event.start_at) <= new Date()
}

function reflectionHref(registration: RegistrationWithEvent) {
  const params = new URLSearchParams()
  params.set('eventId', registration.event_id)
  if (registration.event?.title) params.set('eventTitle', registration.event.title)
  return `/student/growth-reflection?${params.toString()}`
}

function getCalendarEvent(registration: RegistrationWithEvent) {
  const event = registration.event
  if (!event?.start_at || !event?.end_at) return null

  return {
    title: event.title ?? 'Evento LEAD',
    description: event.description,
    startAt: event.start_at,
    endAt: event.end_at,
    location: event.location,
    meetingUrl: event.meeting_url,
    detailUrl: `/es/events/${registration.event_id}`,
  }
}

function getLifecycleForRegistration(registration: RegistrationWithEvent) {
  const event = registration.event
  if (!event) return null

  return getEventLifecycle({
    startAt: event.start_at,
    endAt: event.end_at,
    accessModel: event.access_model === 'application' ? 'application' : 'open',
    capacity: event.capacity,
    registrationStatus: registration.status as RegistrationStatus,
    checkedInAt: registration.checked_in_at,
  })
}

function getRegistrationMessage(registration: RegistrationWithEvent, qrDataUrl: string | null) {
  const lifecycle = getLifecycleForRegistration(registration)

  if (isCheckedIn(registration)) {
    return {
      title: lifecycle?.label ?? 'Check-in realizado',
      body: lifecycle?.description ?? 'Tu asistencia ya fue registrada para este evento.',
      variant: 'success' as const,
    }
  }

  if (registration.status === 'registered') {
    return qrDataUrl
      ? {
      title: 'Código listo',
      body: 'Muestra este código al llegar.',
          variant: 'success' as const,
        }
      : {
          title: lifecycle?.label ?? 'Registro confirmado',
          body: lifecycle?.description ?? 'Ya estas registrado. Los detalles del QR apareceran aqui cuando esten disponibles.',
          variant: 'info' as const,
        }
  }

  if (registration.status === 'pending_review') {
    return {
      title: lifecycle?.label ?? 'Postulación enviada',
      body: lifecycle?.description ?? 'El equipo te escribirá por correo después de revisarla.',
      variant: 'warning' as const,
    }
  }

  if (registration.status === 'rejected') {
    return {
      title: lifecycle?.label ?? 'No seleccionado',
      body: lifecycle?.description ?? 'No fuiste seleccionado para este evento.',
      variant: 'destructive' as const,
    }
  }

  return {
    title: lifecycle?.label ?? 'Cancelado',
    body: lifecycle?.description ?? 'Este registro esta inactivo.',
    variant: 'neutral' as const,
  }
}

function EventMeta({ registration }: { registration: RegistrationWithEvent }) {
  const event = registration.event

  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
      {event?.start_at ? (
        <span className="flex items-start gap-2">
          <Icons.Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{formatDateTime(event.start_at)}</span>
        </span>
      ) : null}
      {event?.location ? (
        <span className="flex items-start gap-2">
          <Icons.MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="break-words">{event.location}</span>
        </span>
      ) : null}
    </div>
  )
}

function QrPanel({ qrDataUrl }: { qrDataUrl: string }) {
  return (
    <div className="w-full max-w-full rounded-lg border border-border bg-white p-3 text-center shadow-sm">
      <div className="mx-auto flex aspect-square w-full max-w-[14rem] items-center justify-center sm:max-w-[15rem]">
        <Image
          src={qrDataUrl}
          alt="Event check-in QR code"
          width={240}
          height={240}
          className="h-auto w-full max-w-[14rem] sm:max-w-[15rem]"
          unoptimized
        />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#111827]">
          Código de check-in del evento
      </p>
    </div>
  )
}

function EventRegistrationCard({
  registration,
  qrDataUrl,
  showQr = false,
}: EventRegistrationCardProps) {
  const event = registration.event
  const message = getRegistrationMessage(registration, qrDataUrl)
  const canCancel = registration.status === 'registered' && !registration.checked_in_at
  const canShowQr = showQr && registration.status === 'registered' && Boolean(qrDataUrl)
  const calendarEvent = canShowQr && isFutureEvent(registration) ? getCalendarEvent(registration) : null

  return (
    <Card
      id={`event-reg-${registration.event_id}`}
      className="min-w-0 scroll-mt-24 overflow-hidden rounded-lg"
    >
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle className="break-words text-lg leading-6">
              {event?.title ?? 'Evento'}
            </CardTitle>
            <EventMeta registration={registration} />
          </div>
          <RegistrationStatusBadge
            status={registration.status as RegistrationStatus}
            checkedIn={isCheckedIn(registration)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <Badge variant={message.variant} size="sm" className="w-fit shrink-0 sm:mt-0.5">
              {message.title}
            </Badge>
            <p className="min-w-0 text-sm leading-6 text-muted-foreground">{message.body}</p>
          </div>
        </div>

        {canShowQr && qrDataUrl ? (
          <div className="space-y-3">
            <QrPanel qrDataUrl={qrDataUrl} />
            {calendarEvent ? <EventCalendarActions event={calendarEvent} layout="stack" /> : null}
          </div>
        ) : null}

        {canReflectOnEvent(registration) ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Convertir en aprendizaje</p>
                  <p className="text-sm leading-6 text-muted-foreground">
              Opcional: captura lo que aprendiste mientras esta experiencia sigue fresca.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href={reflectionHref(registration)}>Crear reflexión</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:flex-1">
            <Link href={`/events/${registration.event_id}`}>Ver detalle</Link>
          </Button>
          {canCancel ? (
            <CancelRegistrationDialog
              registrationId={registration.id}
              eventId={registration.event_id}
              eventTitle={event?.title ?? 'this event'}
              triggerClassName="w-full sm:flex-1"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="rounded-lg border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icons.Calendar className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Aún no tienes registros a eventos</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Explora eventos públicos y regístrate o postula cuando encuentres algo que encaje con tus objetivos.
          </p>
        </div>
        <Button asChild>
          <Link href="/events">Explorar eventos</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function TabEmptyState({
  description,
  icon,
  title,
}: {
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <Card className="rounded-lg border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </span>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CurrentTicket({
  registration,
  qrDataUrl,
}: {
  registration: RegistrationWithEvent
  qrDataUrl: string | null
}) {
  const message = getRegistrationMessage(registration, qrDataUrl)
  const canCancel = registration.status === 'registered' && !registration.checked_in_at
  const calendarEvent = registration.status === 'registered' && isFutureEvent(registration)
    ? getCalendarEvent(registration)
    : null

  return (
    <Card className="min-w-0 overflow-hidden rounded-lg">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <Badge variant="outline">Ticket actual</Badge>
            <CardTitle className="break-words text-2xl leading-8">
              {registration.event?.title ?? 'Tu próximo evento'}
            </CardTitle>
            <CardDescription>
              Ten esto listo en tu celular cuando llegues.
            </CardDescription>
          </div>
          <RegistrationStatusBadge
            status={registration.status as RegistrationStatus}
            checkedIn={isCheckedIn(registration)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <EventMeta registration={registration} />

        <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <Badge variant={message.variant} size="sm" className="w-fit shrink-0 sm:mt-0.5">
              {message.title}
            </Badge>
            <p className="min-w-0 text-sm leading-6 text-muted-foreground">{message.body}</p>
          </div>
        </div>

        {qrDataUrl ? (
          <div className="mx-auto w-full max-w-[17.5rem] sm:max-w-80">
            <QrPanel qrDataUrl={qrDataUrl} />
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <QrCode className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">QR aún no disponible</p>
            <p className="mt-1 text-sm text-muted-foreground">
                    Solo los registros confirmados muestran aquí su código de check-in del evento.
            </p>
          </div>
        )}

        {calendarEvent ? (
          <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Agéndalo antes de cerrar esta página</p>
            <EventCalendarActions event={calendarEvent} />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/events/${registration.event_id}`}>Ver detalle</Link>
          </Button>
          {canCancel ? (
            <CancelRegistrationDialog
              registrationId={registration.id}
              eventId={registration.event_id}
              eventTitle={registration.event?.title ?? 'this event'}
              triggerClassName="w-full sm:w-auto"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function StudentEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: highlightEventId } = await searchParams
  const registrations = await getMyRegistrations()

  const qrEntries = await Promise.all(
    registrations.map(async (registration) => {
      if (registration.status !== 'registered' || !registration.qr_token) {
        return [registration.id, null] as const
      }

      const qrDataUrl = await QRCode.toDataURL(registration.qr_token, {
        margin: 1,
        width: 240,
      })

      return [registration.id, qrDataUrl] as const
    })
  )

  const qrByRegistrationId = new Map(qrEntries)
  const activeRegistrations = registrations.filter(
    (registration) =>
      (registration.status === 'registered' || registration.status === 'attended') &&
      isFutureEvent(registration)
  )
  const activeRegistrationIds = new Set(activeRegistrations.map((registration) => registration.id))
  const applicationRegistrations = registrations.filter(
    (registration) => registration.status === 'pending_review' || registration.status === 'rejected'
  )
  const historyRegistrations = registrations.filter(
    (registration) =>
      !activeRegistrationIds.has(registration.id) &&
      registration.status !== 'pending_review' &&
      registration.status !== 'rejected' &&
      registration.status !== 'cancelled' &&
      (registration.status === 'attended' ||
        (registration.event?.start_at && new Date(registration.event.start_at) <= new Date()))
  )
  const cancelledRegistrations = registrations.filter(
    (registration) => registration.status === 'cancelled'
  )
  const currentTicket = activeRegistrations[0] ?? null
  const currentTicketQrDataUrl = currentTicket ? qrByRegistrationId.get(currentTicket.id) ?? null : null
  const visibleActiveRegistrations = activeRegistrations.filter(
    (registration) => registration.id !== currentTicket?.id
  )

  return (
    <MainContainer maxWidth="7xl" className="space-y-8 py-6 pb-24 sm:py-8">
      <ScrollToHighlightedEvent eventId={highlightEventId} />

      <PageHeader
        eyebrow="Mi LEAD"
        title="Mis eventos"
        description="Revisa tus registros, decisiones de postulación y códigos QR de check-in en un solo lugar."
        actions={
          <Button asChild>
            <Link href="/events">Explorar eventos</Link>
          </Button>
        }
      />

      {registrations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0 space-y-6">
            {currentTicket ? (
              <CurrentTicket
                registration={currentTicket}
                qrDataUrl={currentTicketQrDataUrl}
              />
            ) : (
              <Card className="rounded-lg border-dashed">
                <CardContent className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">No tienes un ticket activo ahora</h2>
                    <p className="text-sm text-muted-foreground">
              Los próximos eventos registrados con QR aparecerán primero aquí.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/events">Buscar evento</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="active" className="min-w-0 space-y-4">
              <TabsList
                className={`grid h-auto w-full gap-1 overflow-visible p-1 ${
                  cancelledRegistrations.length > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <TabsTrigger className="h-9 min-w-0 px-1.5 text-xs leading-tight sm:px-3 sm:text-sm" value="active">
                  Activos ({visibleActiveRegistrations.length})
                </TabsTrigger>
                <TabsTrigger className="h-9 min-w-0 px-1.5 text-xs leading-tight sm:px-3 sm:text-sm" value="applications">
                  Postulaciones ({applicationRegistrations.length})
                </TabsTrigger>
                <TabsTrigger className="h-9 min-w-0 px-1.5 text-xs leading-tight sm:px-3 sm:text-sm" value="history">
                  Historial ({historyRegistrations.length})
                </TabsTrigger>
                {cancelledRegistrations.length > 0 ? (
                  <TabsTrigger className="h-9 min-w-0 px-1.5 text-xs leading-tight sm:px-3 sm:text-sm" value="cancelled">
                    Cancelados ({cancelledRegistrations.length})
                  </TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {visibleActiveRegistrations.length === 0 ? (
                  <TabEmptyState
                    icon={<Icons.Ticket className="h-5 w-5" />}
                    title="No hay otros tickets activos"
              description="Tu próximo ticket se muestra arriba. Otros registros futuros aparecerán aquí."
                  />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {visibleActiveRegistrations.map((registration) => (
                      <EventRegistrationCard
                        key={registration.id}
                        registration={registration}
                        qrDataUrl={qrByRegistrationId.get(registration.id) ?? null}
                        showQr
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="applications" className="space-y-4">
                {applicationRegistrations.length === 0 ? (
                  <TabEmptyState
                    icon={<Icons.Clock className="h-5 w-5" />}
                    title="No hay postulaciones en espera"
              description="Los eventos con postulación aparecerán aquí mientras se revisan."
                  />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {applicationRegistrations.map((registration) => (
                      <EventRegistrationCard
                        key={registration.id}
                        registration={registration}
                        qrDataUrl={null}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {historyRegistrations.length === 0 ? (
                  <TabEmptyState
                    icon={<Icons.Calendar className="h-5 w-5" />}
              title="Aún no hay historial de eventos"
                    description="Los eventos pasados y registros completados apareceran aqui."
                  />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {historyRegistrations.map((registration) => (
                      <EventRegistrationCard
                        key={registration.id}
                        registration={registration}
                        qrDataUrl={null}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {cancelledRegistrations.length > 0 ? (
                <TabsContent value="cancelled" className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {cancelledRegistrations.map((registration) => (
                      <EventRegistrationCard
                        key={registration.id}
                        registration={registration}
                        qrDataUrl={null}
                      />
                    ))}
                  </div>
                </TabsContent>
              ) : null}
            </Tabs>
          </section>

          <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Recomendaciones</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Consejos generales para usar tu QR en cualquier evento.
              </p>
            </div>
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">Para entrar rapido</CardTitle>
          <CardDescription>Aplica a cualquier código QR de tus eventos.</CardDescription>
              </CardHeader>
              <CardContent>
                <EventDayGuidance compact showTitle={false} className="border-0 bg-transparent p-0" />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </MainContainer>
  )
}
