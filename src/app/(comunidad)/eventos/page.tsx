"use client";

import { useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Handshake, MapPin, Mic, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { Segmented } from "@/components/ui/segmented";
import { events, type LeadEvent } from "@/lib/data/community";

const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const weekLabels = ["L", "M", "X", "J", "V", "S", "D"];

const TODAY = "2026-10-01";
const MY_COMMUNITY = ["LEAD Perú", "LEAD América", "LEAD Global"];

function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDayHeader(date: string) {
  const d = parseDate(date);
  return `${d.getDate()} ${monthNames[d.getMonth()].toLowerCase()} · ${dayNames[d.getDay()]}`;
}

function inRange(date: string, start: string, days: number) {
  const target = parseDate(date).getTime();
  const from = parseDate(start).getTime();
  const to = from + days * 86400000;
  return target >= from && target <= to;
}

function EventRow({ event, registered, onToggle }: { event: LeadEvent; registered: boolean; onToggle: () => void }) {
  const typeIcon = {
    Workshop: Wrench,
    Panel: Users,
    Networking: Handshake,
    Charla: Mic,
  }[event.type];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 card-surface p-(--card-spacing) sm:flex-row sm:items-start sm:gap-5">
      <div className="w-full shrink-0 sm:w-32">
        {event.image ? (
          <img
            src={event.image}
            alt={`${event.title} — evento de la comunidad LEAD`}
            className="aspect-media w-full rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-media w-full items-center justify-center rounded-lg bg-muted">
            <TypeIcon icon={typeIcon} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {event.type}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {event.calendar}
          </Badge>
        </div>
        <h3 className="mt-1.5 font-semibold leading-snug">{event.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-small text-muted-foreground">
          <Clock className="size-3.5" /> {event.time} · Por {event.host}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-small text-muted-foreground">
          <MapPin className="size-3.5" /> {event.location}
        </p>
      </div>
      <Button
        variant={registered ? "secondary" : "default"}
        size="sm"
        onClick={onToggle}
        aria-pressed={registered}
        className="shrink-0 self-end sm:self-auto"
      >
        {registered ? (
          <>
            <Check /> Registrado
          </>
        ) : (
          "Registrarme"
        )}
      </Button>
    </div>
  );
}

function TypeIcon({ icon: Icon }: { icon: typeof Wrench }) {
  return <Icon className="size-6 text-brand-purple-light" />;
}

export default function EventosPage() {
  const [view, setView] = useState<"mi" | "toda">("mi");
  const [time, setTime] = useState<"proximos" | "pasados">("proximos");
  const [type, setType] = useState("Todos");
  const [month, setMonth] = useState(9);
  const [year] = useState(2026);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  const visible = events.filter((event) => {
    if (view === "mi" && !MY_COMMUNITY.includes(event.calendar)) return false;
    if (type !== "Todos" && event.type !== type) return false;
    if (time === "pasados" && event.date >= TODAY) return false;
    if (time === "proximos" && event.date < TODAY) return false;
    return true;
  });

  const eventsByDate = new Map<string, LeadEvent[]>();
  for (const event of visible) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayEvents = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return eventsByDate.get(date) ?? [];
  };

  const shownEvents = [...visible].sort((a, b) => a.date.localeCompare(b.date));

  const grouped = new Map<string, LeadEvent[]>();
  for (const event of shownEvents) {
    const list = grouped.get(event.date) ?? [];
    list.push(event);
    grouped.set(event.date, list);
  }

  const toggle = (id: string) =>
    setRegistered((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <header className="mb-8">
        <h1 className="text-h1 font-bold tracking-tight">Eventos</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Lo que pasa en tu capítulo, tu región y toda LEAD.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Segmented
            options={[
              { value: "mi", label: "Mi comunidad" },
              { value: "toda", label: "Toda LEAD" },
            ]}
            value={view}
            onChange={setView}
          />

          <div className="flex flex-wrap gap-2">
            {(["Todos", "Workshop", "Panel", "Networking", "Charla"] as const).map((item) => (
              <FilterChip key={item} active={type === item} onClick={() => setType(item)}>
                {item}
              </FilterChip>
            ))}
          </div>
        </div>
      </header>

      <div className="flex gap-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <Card className="sticky top-20 shadow-sm">
            <CardContent className="px-5 py-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-h3 font-semibold">
                  {monthNames[month]} {year}
                </h2>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMonth((m) => Math.max(8, m - 1))}
                    disabled={month <= 8}
                    aria-label="Mes anterior"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth((m) => Math.min(11, m + 1))}
                    disabled={month >= 11}
                    aria-label="Mes siguiente"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {weekLabels.map((label) => (
                  <span key={label} className="text-caption font-medium text-muted-foreground">
                    {label}
                  </span>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`empty-${i}`} className="aspect-square" aria-hidden="true" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasEvents = dayEvents(day).length > 0;
                  const isSelected = selectedDay === date;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(hasEvents ? (isSelected ? null : date) : null)}
                      disabled={!hasEvents}
                      aria-pressed={isSelected}
                      aria-label={hasEvents ? `${day} de ${monthNames[month]}, con eventos` : `${day} de ${monthNames[month]}`}
                      className={`relative flex aspect-square items-center justify-center rounded-md text-small transition-colors ${
                        isSelected
                          ? "bg-brand-purple/15 font-semibold text-brand-purple-light"
                          : date < TODAY
                            ? "text-muted-foreground/40"
                            : hasEvents
                              ? "text-foreground hover:bg-muted"
                              : "text-muted-foreground/50"
                      } disabled:cursor-default`}
                    >
                      {day}
                      {hasEvents && !isSelected && (
                        <span className="absolute bottom-1 size-1 rounded-full bg-brand-purple-light" />
                      )}
                    </button>
                  );
                })}
              </div>

              <Segmented
                className="mt-3 w-full"
                options={[
                  { value: "proximos", label: "Próximos" },
                  { value: "pasados", label: "Pasados" },
                ]}
                value={time}
                onChange={setTime}
              />
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 flex-1">
          {selectedDay && (
            <p className="mb-4 flex items-center gap-2 text-small text-muted-foreground">
              <Clock className="size-3.5" /> {formatDayHeader(selectedDay)}
            </p>
          )}

          {grouped.size === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <CalendarDays className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No hay eventos {time === "pasados" ? "pasados" : "próximos"}</p>
                <p className="mt-1 text-small text-muted-foreground">
                  Prueba otra vista o explora el calendario.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {[...grouped.entries()].map(([date, dayEventsList]) => (
                <section key={date}>
                  <h2 className="mb-4 flex items-center gap-2 text-body font-semibold text-muted-foreground">
                    <CalendarDays className="size-4 text-brand-purple-light" />
                    {formatDayHeader(date)}
                  </h2>
                  <div className="space-y-3">
                    {dayEventsList.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        registered={registered.has(event.id)}
                        onToggle={() => toggle(event.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}