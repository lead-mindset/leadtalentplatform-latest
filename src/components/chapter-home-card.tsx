import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Users } from "lucide-react";
import { events } from "@/lib/data/community";
import { me } from "@/lib/data/people";

export function ChapterHomeCard() {
  const myEvents = events
    .filter((event) => event.calendar === me.chapter && event.date >= "2026-10-01")
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = myEvents[0];

  return (
    <section className="rounded-xl border border-border/60 card-surface p-(--card-spacing)">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-h3 font-semibold">
          <Users className="size-4 text-brand-purple-light" /> Tu capítulo
        </h2>
        <StatusBadge tone="info">{me.chapter}</StatusBadge>
      </div>

      {next && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
          <CalendarDays className="size-4 shrink-0 text-brand-purple-light" />
          <div className="min-w-0">
            <p className="truncate text-small font-medium">{next.title}</p>
            <p className="truncate text-small text-muted-foreground">
              {next.month} {next.day} · {next.time} · {next.location}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-small font-medium text-brand-purple-light">
        <Link href="/eventos" className="flex items-center gap-1 hover:underline">
          Ver calendario del capítulo <ArrowUpRight className="size-3.5" />
        </Link>
        <Link href="/personas" className="flex items-center gap-1 hover:underline">
          Ver miembros <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <p className="mt-4 border-t border-border/60 pt-3 text-small text-muted-foreground">
        Parte de la red de LEAD: 13 capítulos universitarios en el Perú y expansión en las Américas.
      </p>
    </section>
  );
}