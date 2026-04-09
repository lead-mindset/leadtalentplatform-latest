import Link from "next/link";
import { Calendar, MapPin, Wifi } from "lucide-react";

type EventType = "in_person" | "online" | "hybrid";

interface ExampleEvent {
  id: string;
  title: string;
  date: string;
  chapter: string;
  eventType: EventType;
  location: string | null;
  coverImage: string | null;
}


const EXAMPLE_EVENTS: ExampleEvent[] = [
  {
    id: "example-1",
    title: "Workshop de CV con Deloitte",
    date: "15 abr",
    chapter: "LEAD PUCP",
    eventType: "in_person",
    location: "Lima",
    coverImage: null,
  },
  {
    id: "example-2",
    title: "Networking Tech Lima 2025",
    date: "22 abr",
    chapter: "LEAD UPC",
    eventType: "in_person",
    location: "Lima",
    coverImage: null,
  },
  {
    id: "example-3",
    title: "Simulacro de Entrevistas",
    date: "28 abr",
    chapter: "Online",
    eventType: "online",
    location: null,
    coverImage: null,
  },
];


function EventTypeBadge({ type }: { type: EventType }) {
  if (type === "online") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-info bg-info-muted rounded-full px-2 py-0.5">
        <Wifi size={10} aria-hidden="true" />
        Online
      </span>
    );
  }
  if (type === "hybrid") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning-muted rounded-full px-2 py-0.5">
        Híbrido
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
      <MapPin size={10} aria-hidden="true" />
      Presencial
    </span>
  );
}

function EventCard({ event }: { event: ExampleEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="
        group block rounded-xl border border-border/60
        bg-card overflow-hidden
        hover:border-border hover:shadow-sm
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
      "
      aria-label={`Ver evento: ${event.title}`}
    >
      <div
        className="
          relative w-full bg-muted/60
          flex items-center justify-center
          overflow-hidden
        "
        style={{ minHeight: "88px", height: "88px" }}
        aria-hidden="true"
      >
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-semibold tracking-widest text-muted-foreground/40 uppercase select-none">
            LEAD
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-card-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={11} aria-hidden="true" className="shrink-0" />
          <span>{event.date}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{event.chapter}</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <EventTypeBadge type={event.eventType} />
          <span className="text-xs text-primary font-medium group-hover:underline underline-offset-2">
            Ver evento&nbsp;→
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventsStrip() {
  const events = EXAMPLE_EVENTS;

  if (events.length === 0) return null;

  return (
    <section
      className="py-16 sm:py-20 border-b border-border/60 bg-muted/20"
      aria-labelledby="events-strip-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-baseline justify-between mb-8">
          <h2
            id="events-strip-heading"
            className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
          >
            Próximos eventos
          </h2>
          <Link
            href="/events"
            className="
              text-sm font-medium text-primary
              hover:underline underline-offset-2
              transition-colors shrink-0 ml-4
            "
          >
            Ver todos&nbsp;→
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

      </div>
    </section>
  );
}