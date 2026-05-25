import { Suspense } from 'react'
import Image from 'next/image'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Monitor,
  Users,
} from 'lucide-react'
import { getCachedPublishedEvents } from '@/lib/data/public-events'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { Navbar } from '../(public)/_components/navbar'
import { MainContainer } from '@/components/global/main-container'
import { cn } from '@/lib/utils'
import type { EventWithDetails } from '@/lib/types'

const EVENT_TIME_ZONE = 'America/Lima'
const EVENT_LOCALES = {
  en: 'en-US',
  es: 'es-PE',
} as const

type PublicEventsLocale = keyof typeof EVENT_LOCALES

const EVENT_COPY = {
  en: {
    metadataTitle: 'Events',
    metadataDescription: 'Explore public LEAD events and community programs.',
    pendingDate: 'Date pending',
    pendingTime: 'Time pending',
    online: 'Online',
    hybrid: 'Hybrid',
    inPerson: 'In person',
    pendingLocation: 'Location pending',
    live: 'Live',
    past: 'Past event',
    application: 'Application required',
    open: 'Registration open',
    openCapacity: 'Open seats',
    full: 'Full',
    oneSeat: '1 seat left',
    seatsLeft: (count: number) => `${count} seats left`,
    detail: 'View details',
    register: 'Register',
    apply: 'Apply',
    leadEvent: 'LEAD event',
    fallbackTitle: 'Untitled event',
    registrations: 'registered',
    badge: 'LEAD events',
    heading: 'Explore public LEAD events',
    subheading:
      'Browse public programs, chapter events, and application-based opportunities across the LEAD community.',
    published: 'Published',
    upcoming: 'Upcoming/live',
    note:
      'Upcoming and live events appear first. Past events remain below as a public record of LEAD community activity.',
    upcomingTitle: 'Upcoming and live events',
    upcomingDescription: 'Select an event to view details, register, or apply.',
    emptyTitle: 'No upcoming events published yet',
    emptyBody: 'Check back soon for new LEAD opportunities.',
    pastTitle: 'Past events',
    pastDescription: 'Explore previous programs and LEAD community activity.',
    loading: 'Loading events...',
  },
  es: {
    metadataTitle: 'Eventos',
    metadataDescription: 'Explora proximos eventos de LEAD y registrate en linea.',
    pendingDate: 'Fecha pendiente',
    pendingTime: 'Hora pendiente',
    online: 'En linea',
    hybrid: 'Hibrido',
    inPerson: 'Presencial',
    pendingLocation: 'Ubicacion pendiente',
    live: 'En vivo',
    past: 'Evento pasado',
    application: 'Requiere postulacion',
    open: 'Registro abierto',
    openCapacity: 'Cupos abiertos',
    full: 'Lleno',
    oneSeat: 'Queda 1 cupo',
    seatsLeft: (count: number) => `Quedan ${count} cupos`,
    detail: 'Ver detalle',
    register: 'Registrarme',
    apply: 'Postular',
    leadEvent: 'Evento LEAD',
    fallbackTitle: 'Evento sin titulo',
    registrations: 'registrados',
    badge: 'Eventos LEAD',
    heading: 'Encuentra tu proximo evento LEAD',
    subheading:
      'Explora eventos publicos, programas de capitulos y oportunidades con postulacion de la comunidad LEAD.',
    published: 'Publicados',
    upcoming: 'Proximos/en vivo',
    note:
      'Los eventos proximos y en vivo aparecen primero. Los eventos pasados quedan abajo como referencia para la comunidad LEAD.',
    upcomingTitle: 'Eventos proximos y en vivo',
    upcomingDescription: 'Selecciona un evento para ver detalles, registrarte o postular.',
    emptyTitle: 'Aun no hay eventos proximos publicados',
    emptyBody: 'Vuelve pronto para ver nuevas oportunidades de LEAD.',
    pastTitle: 'Eventos pasados',
    pastDescription: 'Explora programas anteriores y actividad de la comunidad LEAD.',
    loading: 'Cargando eventos...',
  },
} as const

export const metadata = {
  title: 'Events',
  description: 'Explore public LEAD events and community programs.',
}

function resolveLocale(locale?: string): PublicEventsLocale {
  return locale === 'en' ? 'en' : 'es'
}

function formatDate(value: string, locale: PublicEventsLocale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EVENT_COPY[locale].pendingDate

  return date.toLocaleDateString(EVENT_LOCALES[locale], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: EVENT_TIME_ZONE,
  })
}

function formatTime(value: string, locale: PublicEventsLocale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EVENT_COPY[locale].pendingTime

  return date.toLocaleTimeString(EVENT_LOCALES[locale], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  })
}

function getEventTypeLabel(eventType: EventWithDetails['event_type'], locale: PublicEventsLocale) {
  const copy = EVENT_COPY[locale]
  if (eventType === 'online') return copy.online
  if (eventType === 'hybrid') return copy.hybrid
  return copy.inPerson
}

function getLocationLabel(event: EventWithDetails, locale: PublicEventsLocale) {
  const copy = EVENT_COPY[locale]
  if (event.event_type === 'online') return copy.online
  if (event.event_type === 'hybrid') {
    return event.location_name || event.location_city || event.location || copy.hybrid
  }

  return event.location_name || event.location_city || event.location || copy.pendingLocation
}

function getEventTiming(event: EventWithDetails, locale: PublicEventsLocale) {
  const copy = EVENT_COPY[locale]
  const now = Date.now()
  const start = new Date(event.start_at).getTime()
  const end = new Date(event.end_at).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { label: copy.pendingDate, variant: 'outline' as const }
  }

  if (now >= start && now <= end) {
    return { label: copy.live, variant: 'live' as const }
  }

  if (now > end) {
    return { label: copy.past, variant: 'outline' as const }
  }

  return event.access_model === 'application'
    ? { label: copy.application, variant: 'info' as const }
    : { label: copy.open, variant: 'success' as const }
}

function getAvailabilityLabel(event: EventWithDetails, locale: PublicEventsLocale) {
  const copy = EVENT_COPY[locale]
  if (event.capacity === null) return copy.openCapacity

  const remaining = Math.max(0, event.capacity - event._count.registrations)
  if (remaining === 0) return copy.full
  if (remaining === 1) return copy.oneSeat
  return copy.seatsLeft(remaining)
}

function getAvailabilityVariant(event: EventWithDetails) {
  if (event.capacity === null) return 'success' as const

  const remaining = Math.max(0, event.capacity - event._count.registrations)
  if (remaining === 0) return 'destructive' as const
  if (remaining <= 10) return 'warning' as const
  return 'neutral' as const
}

function getEventActionLabel(event: EventWithDetails, locale: PublicEventsLocale) {
  const copy = EVENT_COPY[locale]
  const end = new Date(event.end_at).getTime()

  if (!Number.isFinite(end) || Date.now() > end) return copy.detail

  if (event.capacity !== null && event._count.registrations >= event.capacity) {
    return copy.detail
  }

  return event.access_model === 'application' ? copy.apply : copy.register
}

function EventCard({ event, locale }: { event: EventWithDetails; locale: PublicEventsLocale }) {
  const copy = EVENT_COPY[locale]
  const timing = getEventTiming(event, locale)
  const ownerChapter = event.chapter?.name ?? event.owner_chapter?.name ?? 'LEAD'
  const availability = getAvailabilityLabel(event, locale)
  const availabilityVariant = getAvailabilityVariant(event)
  const actionLabel = getEventActionLabel(event, locale)
  const description = event.description?.trim()

  return (
    <Card className={cn('group overflow-hidden transition-colors hover:border-primary/40', timing.label === copy.past && 'opacity-80')}>
      <CardContent className="p-0">
        <Link href={`/events/${event.id}`} className="block">
          <div className="grid gap-0 lg:grid-cols-[17rem_1fr]">
            <div className="relative min-h-52 overflow-hidden bg-muted lg:min-h-full">
              {event.cover_image ? (
                <Image
                  src={event.cover_image}
                  alt={event.title || copy.fallbackTitle}
                  fill
                  sizes="(min-width: 1024px) 17rem, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full min-h-52 flex-col justify-between bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.28),transparent_34%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline" className="bg-background/70 backdrop-blur">
                      {copy.leadEvent}
                    </Badge>
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{formatDate(event.start_at, locale)}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                      {formatTime(event.start_at, locale)}
                    </p>
                    <p className="mt-3 line-clamp-1 text-sm text-muted-foreground">{ownerChapter}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5 p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={timing.variant}>{timing.label}</Badge>
                    <Badge variant="outline">{getEventTypeLabel(event.event_type, locale)}</Badge>
                    <Badge variant={availabilityVariant}>{availability}</Badge>
                  </div>
                  <div className="space-y-2">
                    <h2 className="line-clamp-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {event.title || copy.fallbackTitle}
                    </h2>
                    {description ? (
                      <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <span
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full shrink-0 justify-between sm:w-auto sm:min-w-36'
                  )}
                  aria-hidden="true"
                >
                  {actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>

              <div className="grid gap-3 border-t pt-4 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {formatDate(event.start_at, locale)} - {formatTime(event.start_at, locale)}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ownerChapter}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  {event.event_type === 'online' ? (
                    <Monitor className="h-4 w-4 shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{getLocationLabel(event, locale)}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 sm:col-span-2 xl:col-span-1">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {event._count.registrations} {copy.registrations}
                    {event.capacity !== null ? ` / ${event.capacity}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

async function EventsContent({ locale }: { locale: PublicEventsLocale }) {
  const copy = EVENT_COPY[locale]
  const events: EventWithDetails[] = await getCachedPublishedEvents()
  const now = Date.now()
  const upcomingEvents = events
    .filter((event) => new Date(event.end_at).getTime() >= now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
  const pastEvents = events
    .filter((event) => new Date(event.end_at).getTime() < now)
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
  const openEvents = upcomingEvents.length

  return (
    <main className="min-h-screen bg-background">
      <MainContainer className="space-y-8 pb-20 pt-8 md:pt-12">
        <section className="space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="outline" className="w-fit">
                {copy.badge}
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                  {copy.heading}
                </h1>
                <p className="text-base text-muted-foreground md:text-lg">
                  {copy.subheading}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-2xl font-semibold">{events.length}</p>
                <p className="text-xs text-muted-foreground">{copy.published}</p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-2xl font-semibold">{openEvents}</p>
                <p className="text-xs text-muted-foreground">{copy.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{copy.note}</span>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-b pb-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{copy.upcomingTitle}</h2>
              <p className="text-sm text-muted-foreground">{copy.upcomingDescription}</p>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{copy.emptyTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {copy.emptyBody}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            </div>
          )}
        </section>

        {pastEvents.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{copy.pastTitle}</h2>
                <p className="text-sm text-muted-foreground">{copy.pastDescription}</p>
              </div>
            </div>

            <div className="space-y-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </MainContainer>
    </main>
  )
}

type EventsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale } = await params
  const resolvedLocale = resolveLocale(locale)
  const copy = EVENT_COPY[resolvedLocale]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            {copy.loading}
          </div>
        }
      >
        <EventsContent locale={resolvedLocale} />
      </Suspense>
    </div>
  )
}
