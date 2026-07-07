import { Suspense } from 'react'
import Image from 'next/image'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Monitor,
  Users,
} from 'lucide-react'
import { getCachedPublishedEventPreview } from '@/lib/data/public-events'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { Navbar } from '../(public)/_components/navbar'
import { MainContainer } from '@/components/global/main-container'
import { cn } from '@/lib/utils'
import type { EventWithDetails } from '@/lib/types'

const EVENT_TIME_ZONE = 'America/Lima'
const INITIAL_UPCOMING_EVENT_LIMIT = 12
const INITIAL_PAST_EVENT_LIMIT = 6
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
    detail: 'View more',
    register: 'Register',
    apply: 'Apply',
    leadEvent: 'LEAD event',
    fallbackTitle: 'Untitled event',
    registrations: 'registered',
    heading: 'Join an event',
    subheading:
      'Discover LEAD events that help you learn, connect, and grow with the community.',
    published: 'Published',
    upcoming: 'Upcoming/live',
    emptyTitle: 'No upcoming events published yet',
    emptyBody: 'Check back soon for new LEAD opportunities.',
    pastTitle: 'Past events',
    pastDescription: 'Explore previous programs and LEAD community activity.',
    moreUpcoming: 'More upcoming events will appear here as the page grows.',
    morePast: 'More past events are archived by the LEAD team.',
    loading: 'Loading events...',
  },
  es: {
    metadataTitle: 'Eventos',
    metadataDescription: 'Explora próximos eventos de LEAD y regístrate en línea.',
    pendingDate: 'Fecha pendiente',
    pendingTime: 'Hora pendiente',
    online: 'En línea',
    hybrid: 'Híbrido',
    inPerson: 'Presencial',
    pendingLocation: 'Ubicación pendiente',
    live: 'En vivo',
    past: 'Evento pasado',
    application: 'Requiere postulación',
    open: 'Registro abierto',
    openCapacity: 'Cupos abiertos',
    full: 'Lleno',
    oneSeat: 'Queda 1 cupo',
    seatsLeft: (count: number) => `Quedan ${count} cupos`,
    detail: 'Ver más',
    register: 'Registrarme',
    apply: 'Postular',
    leadEvent: 'Evento LEAD',
    fallbackTitle: 'Evento sin título',
    registrations: 'registrados',
    heading: 'Únete a un evento',
    subheading:
      'Descubre eventos de LEAD que te ayudan a aprender, conectar y crecer con la comunidad.',
    published: 'Publicados',
    upcoming: 'Próximos/en vivo',
    emptyTitle: 'Aún no hay eventos próximos publicados',
    emptyBody: 'Vuelve pronto para ver nuevas oportunidades de LEAD.',
    pastTitle: 'Eventos pasados',
    pastDescription: 'Explora programas anteriores y actividad de la comunidad LEAD.',
    moreUpcoming: 'Más eventos próximos aparecerán aquí a medida que crezca la página.',
    morePast: 'Más eventos pasados quedan archivados por el equipo LEAD.',
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

function getEventActionLabel(event: EventWithDetails, locale: PublicEventsLocale) {
  const copy = EVENT_COPY[locale]
  const end = new Date(event.end_at).getTime()

  if (!Number.isFinite(end) || Date.now() > end) return copy.detail

  if (event.capacity !== null && event._count.registrations >= event.capacity) {
    return copy.detail
  }

  return event.access_model === 'application' ? copy.apply : copy.register
}

function getEventPreviewNowIso() {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString()
}

function EventCard({ event, locale }: { event: EventWithDetails; locale: PublicEventsLocale }) {
  const copy = EVENT_COPY[locale]
  const timing = getEventTiming(event, locale)
  const ownerChapter = event.chapter?.name ?? event.owner_chapter?.name ?? 'LEAD'
  const actionLabel = getEventActionLabel(event, locale)
  const description = event.description?.trim()

  return (
    <Card className={cn('group overflow-hidden border-border/60 transition-all duration-300 hover:border-primary/50 hover:shadow-sm', timing.label === copy.past && 'opacity-80')}>
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
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full min-h-52 flex-col justify-between bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.28),transparent_34%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))] p-5">
                  <div className="flex justify-end">
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

            <div className="space-y-4 p-5 md:p-6">
              <div className="text-sm text-muted-foreground">
                <CalendarDays className="mr-1.5 inline-block h-4 w-4 align-text-top" />
                {formatDate(event.start_at, locale)} - {formatTime(event.start_at, locale)}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <h2 className="line-clamp-2 text-xl font-medium tracking-tight text-foreground/85 transition-colors duration-300 group-hover:text-foreground md:text-2xl">
                    {event.title || copy.fallbackTitle}
                  </h2>
                  {description ? (
                    <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>

                <span
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full shrink-0 justify-between transition-all duration-300 sm:w-auto sm:min-w-36 group-hover:border-primary/30 group-hover:text-foreground'
                  )}
                  aria-hidden="true"
                >
                  {actionLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>

              <div className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{ownerChapter}</span>
                </div>
                <div className="flex items-center gap-2">
                  {event.event_type === 'online' ? (
                    <Monitor className="h-4 w-4 shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 shrink-0" />
                  )}
                  <span>{getLocationLabel(event, locale)}</span>
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
  const {
    upcomingEvents,
    pastEvents,
    hasMoreUpcoming,
    hasMorePast,
  } = await getCachedPublishedEventPreview({
    nowIso: getEventPreviewNowIso(),
    upcomingLimit: INITIAL_UPCOMING_EVENT_LIMIT,
    pastLimit: INITIAL_PAST_EVENT_LIMIT,
  })
  return (
    <main className="min-h-screen bg-background">
      <MainContainer className="space-y-8 pb-20 pt-8 md:pt-12">
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {copy.heading}
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            {copy.subheading}
          </p>
        </section>

        <section className="space-y-4">
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
              {hasMoreUpcoming ? (
                <p className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
                  {copy.moreUpcoming}
                </p>
              ) : null}
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
              {hasMorePast ? (
                <p className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
                  {copy.morePast}
                </p>
              ) : null}
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
