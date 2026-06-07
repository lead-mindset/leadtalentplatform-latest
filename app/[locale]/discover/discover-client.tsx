"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MainContainer } from "@/components/global/main-container"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  title: string
  description: string
  start_at: string
  end_at: string | null
  location_name: string | null
  location_city: string | null
  cover_image_url: string | null
  event_type: "in_person" | "online" | "hybrid"
  chapterName: string
}

interface Chapter {
  id: string
  name: string
  city: string | null
  region: string | null
  university: string
}

interface Country {
  id: string
  name: string
  chapterCount: number
  eventCount: number
  status: "active" | "growing"
}

interface DiscoverClientProps {
  locale: string
  initialEvents: Event[]
  chapters: Chapter[]
  countries: Country[]
}

const EVENT_TIME_ZONE = "America/Lima"
const EVENT_LOCALE = "es-PE"

const featuredOpportunities = [
  {
    id: "lead-spark",
    title: "LEAD SPARK",
    label: "Flagship event",
    description: "Conecta con empresas, talento LEAD y experiencias profesionales de alto impacto.",
    href: "/events",
    accent: "from-fuchsia-500/30 via-violet-500/20 to-cyan-400/20",
  },
  {
    id: "lead-her",
    title: "LEAD HER",
    label: "Leadership program",
    description: "Espacios para crecer, liderar y construir comunidad con mujeres en STEM y negocios.",
    href: "/events",
    accent: "from-rose-500/25 via-fuchsia-500/20 to-violet-500/20",
  },
  {
    id: "discover-day",
    title: "Discover Day",
    label: "First step",
    description: "La puerta de entrada para conocer LEAD, sus chapters y oportunidades.",
    href: "/events",
    accent: "from-cyan-400/25 via-blue-500/20 to-violet-500/20",
  },
  {
    id: "stars-frontier",
    title: "Stars & Frontier",
    label: "Growth paths",
    description: "Iniciativas para desarrollar talento, liderazgo y contribución organizacional.",
    href: "/events",
    accent: "from-amber-300/25 via-fuchsia-500/15 to-cyan-400/20",
  },
]

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha pendiente"

  return date.toLocaleDateString(EVENT_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: EVENT_TIME_ZONE,
  })
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Hora pendiente"

  return date.toLocaleTimeString(EVENT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_TIME_ZONE,
  })
}

function getEventTypeLabel(eventType: Event["event_type"]) {
  if (eventType === "online") return "En linea"
  if (eventType === "hybrid") return "Hibrido"
  return "Presencial"
}

function getLocationLabel(event: Event) {
  if (event.event_type === "online") return "En linea"
  return event.location_name || event.location_city || "Ubicacion pendiente"
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
    </div>
  )
}

function OpportunityCard({
  opportunity,
  locale,
}: {
  opportunity: (typeof featuredOpportunities)[number]
  locale: string
}) {
  return (
    <Link
      href={`/${locale}${opportunity.href}`}
      className="group block overflow-hidden rounded-lg border bg-card text-card-foreground transition-colors hover:border-primary/50"
    >
      <div className={cn("h-28 bg-gradient-to-br p-4", opportunity.accent)}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 text-primary shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <Badge variant="outline" className="w-fit">
          {opportunity.label}
        </Badge>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{opportunity.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{opportunity.description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          Explorar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}

function EventRow({ event, locale }: { event: Event; locale: string }) {
  return (
    <Link
      href={`/${locale}/events/${event.id}`}
      className="group grid gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 md:grid-cols-[8.5rem_minmax(0,1fr)_8rem]"
    >
      <div className="flex flex-row gap-3 md:flex-col md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{formatDate(event.start_at)}</p>
          <p className="mt-1 text-lg font-semibold">{formatTime(event.start_at)}</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {getEventTypeLabel(event.event_type)}
        </Badge>
      </div>

      <div className="min-w-0 space-y-3">
        <h3 className="line-clamp-2 text-xl font-semibold tracking-tight md:text-2xl">
          {event.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{event.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {event.chapterName || "LEAD"}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {getLocationLabel(event)}
          </span>
        </div>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted md:aspect-square">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
        )}
      </div>
    </Link>
  )
}

function ChapterCard({ chapter, locale }: { chapter: Chapter; locale: string }) {
  return (
    <Link
      href={`/${locale}/chapters/${chapter.id}`}
      className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{chapter.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {chapter.university}
          </p>
          <p className="mt-2 text-xs font-medium text-primary">
            {chapter.city || chapter.region || "LEAD Chapter"}
          </p>
        </div>
      </div>
    </Link>
  )
}

function CountryCard({ country }: { country: Country }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe2 className="h-5 w-5" />
        </div>
        <Badge variant={country.status === "active" ? "success" : "outline"}>
          {country.status === "active" ? "Activo" : "En crecimiento"}
        </Badge>
      </div>
      <h3 className="mt-5 text-xl font-semibold">{country.name}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-2xl font-semibold">{country.chapterCount}</p>
          <p className="text-muted-foreground">chapters</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-2xl font-semibold">{country.eventCount}</p>
          <p className="text-muted-foreground">eventos</p>
        </div>
      </div>
    </div>
  )
}

export function DiscoverClient({
  locale,
  initialEvents,
  chapters,
  countries,
}: DiscoverClientProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return initialEvents

    return initialEvents.filter((event) => {
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.chapterName.toLowerCase().includes(query) ||
        getLocationLabel(event).toLowerCase().includes(query)
      )
    })
  }, [initialEvents, searchQuery])

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/20">
        <MainContainer className="py-8 md:py-12">
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="bg-[linear-gradient(135deg,hsl(var(--primary)/0.20),hsl(var(--card))_45%,hsl(var(--accent)/0.16))] p-5 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <Badge variant="outline" className="mb-4 w-fit">
                    LEAD Discover
                  </Badge>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                    Encuentra donde participar, crecer y liderar.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                    Explora oportunidades, eventos, chapters y paises donde la comunidad LEAD esta construyendo momentum.
                  </p>
                </div>
                <Button asChild size="lg" className="w-full md:w-auto">
                  <Link href={`/${locale}/events`}>
                    Ver eventos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid border-t md:grid-cols-4">
              {[
                ["4", "formas de explorar"],
                [String(initialEvents.length), "eventos próximos"],
                [String(chapters.length), "chapters"],
                [String(countries.length), "paises"],
              ].map(([value, label]) => (
                <div key={label} className="border-t p-4 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </MainContainer>
      </section>

      <MainContainer className="space-y-14 py-10 md:py-14">
        <section className="space-y-6">
          <SectionHeader
            eyebrow="01"
            title="Featured Opportunities"
            description="Programas e iniciativas para dar el primer paso, desarrollar liderazgo y conectar con oportunidades reales."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredOpportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} locale={locale} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="02"
              title="Upcoming Events"
              description="Encuentra eventos abiertos, workshops y experiencias donde puedes registrarte o postular."
            />
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar evento, chapter o ciudad"
                className="pl-9"
              />
            </div>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="space-y-3">
              {filteredEvents.slice(0, 8).map((event) => (
                <EventRow key={event.id} event={event} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Star className="mx-auto h-9 w-9 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No encontramos eventos con esa busqueda</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Prueba con otro chapter, ciudad o tema.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="03"
            title="Explore by Chapter"
            description="Encuentra tu comunidad local y descubre que esta construyendo cada chapter."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.slice(0, 9).map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} locale={locale} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="04"
            title="Explore by Country"
            description="Mira como LEAD empieza a crecer como una red de talento y liderazgo en Latinoamerica."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {countries.map((country) => (
              <CountryCard key={country.id} country={country} />
            ))}
          </div>
        </section>
      </MainContainer>
    </main>
  )
}
