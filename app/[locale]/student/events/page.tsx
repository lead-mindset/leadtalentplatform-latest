import QRCode from 'qrcode'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { QrCode } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMyRegistrations } from '@/lib/actions/events/get-data'
import { CancelRegistrationDialog } from '@/components/events/cancel-registration-dialog'
import { ScrollToHighlightedEvent } from '@/components/events/scroll-to-highlighted-event'
import { RegistrationStatusBadge } from '@/components/events/registration-status-badge'
import type { RegistrationStatus } from '@/lib/types'
import { Link } from '@/i18n/routing'
import { Icons } from '@/components/ui/icons'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'

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

function getRegistrationMessage(registration: RegistrationWithEvent, qrDataUrl: string | null) {
  if (isCheckedIn(registration)) {
    return {
      title: 'Check-in realizado',
      body: 'Tu asistencia ya fue registrada para este evento.',
      variant: 'success' as const,
    }
  }

  if (registration.status === 'registered') {
    return qrDataUrl
      ? {
          title: 'QR listo',
          body: 'Muestra este codigo al llegar. Mantén el brillo alto para facilitar el check-in.',
          variant: 'success' as const,
        }
      : {
          title: 'Registro confirmado',
          body: 'Ya estas registrado. Los detalles del QR apareceran aqui cuando esten disponibles.',
          variant: 'info' as const,
        }
  }

  if (registration.status === 'pending_review') {
    return {
      title: 'Postulacion enviada',
      body: 'El equipo te escribira por correo despues de revisarla.',
      variant: 'warning' as const,
    }
  }

  if (registration.status === 'rejected') {
    return {
      title: 'No seleccionado',
      body: 'No fuiste seleccionado para este evento.',
      variant: 'destructive' as const,
    }
  }

  return {
    title: 'Cancelado',
    body: 'Este registro esta inactivo.',
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
    <div className="rounded-lg border border-border bg-white p-3 text-center shadow-sm">
      <div className="mx-auto flex aspect-square w-full max-w-[15rem] items-center justify-center">
        <Image
          src={qrDataUrl}
          alt="Event check-in QR code"
          width={240}
          height={240}
          className="h-auto w-full max-w-[15rem]"
          unoptimized
        />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#111827]">
        Listo para check-in
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

  return (
    <Card
      id={`event-reg-${registration.event_id}`}
      className="scroll-mt-24 overflow-hidden rounded-lg"
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
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-start gap-3">
            <Badge variant={message.variant} size="sm" className="mt-0.5 shrink-0">
              {message.title}
            </Badge>
            <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
          </div>
        </div>

        {canShowQr && qrDataUrl ? <QrPanel qrDataUrl={qrDataUrl} /> : null}

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
          <h2 className="text-lg font-semibold">Aun no tienes registros a eventos</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Explora eventos publicos y registrate o postula cuando encuentres algo que encaje con tus objetivos.
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

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Ticket actual</Badge>
            <CardTitle className="break-words text-2xl leading-8">
              {registration.event?.title ?? 'Tu proximo evento'}
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

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          <EventMeta registration={registration} />

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Badge variant={message.variant} size="sm" className="mt-0.5 shrink-0">
                {message.title}
              </Badge>
              <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
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
        </div>

        {qrDataUrl ? (
          <QrPanel qrDataUrl={qrDataUrl} />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <QrCode className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">QR aun no disponible</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Los registros confirmados muestran aqui su codigo QR.
            </p>
          </div>
        )}
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
  const visibleActiveRegistrations = activeRegistrations.filter(
    (registration) => registration.id !== currentTicket?.id
  )

  return (
    <MainContainer maxWidth="7xl" className="space-y-8 py-6 pb-24 sm:py-8">
      <ScrollToHighlightedEvent eventId={highlightEventId} />

      <PageHeader
        eyebrow="Mi LEAD"
        title="Mis eventos"
        description="Revisa tus registros, decisiones de postulacion y codigos QR de check-in en un solo lugar."
        actions={
          <Button asChild>
            <Link href="/events">Explorar eventos</Link>
          </Button>
        }
      />

      {registrations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="space-y-6">
            {currentTicket ? (
              <CurrentTicket
                registration={currentTicket}
                qrDataUrl={qrByRegistrationId.get(currentTicket.id) ?? null}
              />
            ) : (
              <Card className="rounded-lg border-dashed">
                <CardContent className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">No tienes un ticket activo ahora</h2>
                    <p className="text-sm text-muted-foreground">
                      Los proximos eventos registrados con QR apareceran primero aqui.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/events">Buscar evento</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="active" className="space-y-4">
              <TabsList className="flex w-full justify-start overflow-x-auto">
                <TabsTrigger value="active">Activos ({visibleActiveRegistrations.length})</TabsTrigger>
                <TabsTrigger value="applications">
                  Postulaciones ({applicationRegistrations.length})
                </TabsTrigger>
                <TabsTrigger value="history">Historial ({historyRegistrations.length})</TabsTrigger>
                {cancelledRegistrations.length > 0 ? (
                  <TabsTrigger value="cancelled">
                    Cancelados ({cancelledRegistrations.length})
                  </TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {visibleActiveRegistrations.length === 0 ? (
                  <TabEmptyState
                    icon={<Icons.Ticket className="h-5 w-5" />}
                    title="No hay otros tickets activos"
                    description="Tu proximo ticket se muestra arriba. Otros registros futuros apareceran aqui."
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
                    description="Los eventos con postulacion apareceran aqui mientras se revisan."
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
                    title="Aun no hay historial de eventos"
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

          <aside className="space-y-4">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">Basicos del check-in</CardTitle>
                <CardDescription>Detalles simples para entrar mas rapido al evento.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <li className="flex gap-3">
                    <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Usa el QR del ticket actual cuando llegues.</span>
                  </li>
                  <li className="flex gap-3">
                    <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Las postulaciones pendientes no tienen QR hasta ser aprobadas.</span>
                  </li>
                  <li className="flex gap-3">
                    <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Los registros cancelados o rechazados quedan inactivos.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </MainContainer>
  )
}
