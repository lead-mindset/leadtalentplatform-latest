"use client";
import { InitialsAvatar } from "@/components/initials-avatar";
import { StatusBadge } from "@/components/ui/status-badge";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, Check, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminMembers, adminStats, juntas } from "@/lib/data/admin";
import { events } from "@/lib/data/community";
import { useAdminRole } from "@/lib/admin-role";

export default function AdminPage() {
  const role = useAdminRole();
  const [members, setMembers] = useState(adminMembers);
  const [pendingCount, setPendingCount] = useState(adminStats.pendingApprovals);

  const pending = members.filter((member) => member.status === "pending");

  const act = (id: string, status: "active" | "rejected") => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, status } : member)));
    setPendingCount((prev) => Math.max(0, prev - 1));
  };

  if (role === "board") {
    const totalMembers = juntas.reduce((sum, chapter) => sum + chapter.members, 0);
    const boardStats = [
      { label: "Miembros totales", value: totalMembers },
      { label: "Capítulos", value: juntas.length },
      { label: "Aprobaciones pendientes", value: pendingCount },
    ];

    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-h1 font-bold tracking-tight">Panel global</h1>
          <p className="mt-1 text-small text-muted-foreground">Operación de todos los capítulos de LEAD.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {boardStats.map((stat) => (
            <div key={stat.label} className="card-surface rounded-xl border border-border/60 p-4">
              <p className="text-small font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-display font-bold leading-none">{stat.value}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-h3 font-semibold">Capítulos</h2>
          <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
            {juntas.map((chapter) => {
              const president = chapter.junta.find((member) => member.tier === "presidente");
              return (
                <Link key={chapter.chapterId} href={`/admin/capitulos/${chapter.chapterId}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{chapter.name}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {president ? `${president.role}: ${president.name}` : "Sin presidente asignado"}
                    </p>
                  </div>
                  <span className="shrink-0 text-caption text-muted-foreground">{chapter.members} miembros</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-h3 font-semibold">Aprobaciones pendientes</h2>
          <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
            {pending.length === 0 ? (
              <div className="px-4 py-6 text-center text-small text-muted-foreground">No hay solicitudes pendientes.</div>
            ) : (
              pending.map((member) => (
                <div key={member.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                  <InitialsAvatar initials={member.initials} color={member.avatarColor} className="size-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="truncate text-caption text-muted-foreground">{member.chapter} · {member.joined}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1" onClick={() => act(member.id, "active")}><Check className="size-3.5" /> Aprobar</Button>
                    <Button size="sm" variant="destructive-outline" className="gap-1" onClick={() => act(member.id, "rejected")}><X className="size-3.5" /> Rechazar</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  // Chapter e-board view (scoped)
  const myEvents = events
    .filter((event) => event.calendar === "LEAD Perú" && event.date >= "2026-10-01")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const stats = [
    { label: "Miembros activos", value: members.filter((member) => member.status === "active").length },
    { label: "Aprobaciones pendientes", value: pendingCount },
    { label: "Eventos del capítulo", value: myEvents.length },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-h1 font-bold tracking-tight">LEAD UTEC</h1>
        <StatusBadge tone="info">Presidente</StatusBadge>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface rounded-xl border border-border/60 p-4">
            <p className="text-small font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-display font-bold leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-h3 font-semibold">Aprobaciones pendientes</h2>
          <Link href="/admin/miembros" className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline">Ver miembros <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
          {pending.length === 0 ? (
            <div className="px-4 py-6 text-center text-small text-muted-foreground">No hay solicitudes pendientes.</div>
          ) : (
            pending.map((member) => (
              <div key={member.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <InitialsAvatar initials={member.initials} color={member.avatarColor} className="size-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="truncate text-caption text-muted-foreground">{member.joined}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1" onClick={() => act(member.id, "active")}><Check className="size-3.5" /> Aprobar</Button>
                  <Button size="sm" variant="destructive-outline" className="gap-1" onClick={() => act(member.id, "rejected")}><X className="size-3.5" /> Rechazar</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-h3 font-semibold">Próximos eventos del capítulo</h2>
          <Link href="/admin/eventos" className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline">Gestionar <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
          {myEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                <span className="text-caption font-bold tracking-wide text-brand-purple-light">{event.month}</span>
                <span className="text-h2 font-bold leading-none">{event.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{event.title}</p>
                <p className="truncate text-caption text-muted-foreground">{event.location} · {event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/miembros" className="card-surface group flex items-center gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-purple-light/30">
          <Users className="size-5 shrink-0 text-brand-purple-light" />
          <span className="flex-1 font-medium">Gestionar miembros</span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href="/admin/eventos" className="card-surface group flex items-center gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-purple-light/30">
          <CalendarDays className="size-5 shrink-0 text-brand-purple-light" />
          <span className="flex-1 font-medium">Gestionar eventos</span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}