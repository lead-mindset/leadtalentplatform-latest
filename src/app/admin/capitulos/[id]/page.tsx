"use client";
import { StatusBadge } from "@/components/ui/status-badge";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InitialsAvatar } from "@/components/initials-avatar";
import { FilterChip } from "@/components/ui/filter-chip";
import { juntas, standardRoles, type JuntaMember } from "@/lib/data/admin";

const tierTone: Record<string, "info" | "success" | "muted" | "destructive"> = {
  presidente: "success",
  vp: "info",
  director: "muted",
  voluntario: "muted",
};

const tierLabel: Record<string, string> = {
  presidente: "Presidente",
  vp: "Vicepresidente",
  director: "Junta",
  voluntario: "Voluntario",
};

function deriveTier(role: string): JuntaMember["tier"] {
  const normalized = role.trim().toLowerCase();
  if (normalized.includes("presidente")) return "presidente";
  if (normalized === "vicepresidente" || normalized === "vp" || normalized.includes("vice")) return "vp";
  if (normalized === "voluntario" || normalized.includes("voluntari")) return "voluntario";
  return "director";
}

export default function AdminCapituloPage() {
  const params = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
  const [members, setMembers] = useState<JuntaMember[]>(() => {
    const chapter = juntas.find((item) => item.chapterId === params.id);
    return chapter ? chapter.junta : [];
  });

  const chapter = juntas.find((item) => item.chapterId === params.id);

  if (!chapter) {
    return (
      <div className="py-16 text-center">
        <p className="font-medium">No encontramos este capítulo.</p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/admin/capitulos">Ver capítulos</Link>
        </Button>
      </div>
    );
  }

  const setRole = (id: string, role: string) =>
    setMembers((prev) =>
      prev.map((member) => (member.id === id ? { ...member, role, tier: deriveTier(role) } : member))
    );

  const byTier = (tier: JuntaMember["tier"]) => members.filter((member) => member.tier === tier);
  const president = byTier("presidente")[0];
  const vp = byTier("vp")[0];
  const directors = byTier("director");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-h1 font-bold tracking-tight">{chapter.name}</h1>
          <p className="mt-1 text-small text-muted-foreground">
            {chapter.university} · {chapter.region}
          </p>
        </div>
        <Button size="sm" variant={editing ? "secondary" : "outline"} className="gap-1.5" onClick={() => setEditing((prev) => !prev)}>
          {editing ? <><X className="size-3.5" /> Listo</> : <><Pencil className="size-3.5" /> Gestionar roles</>}
        </Button>
      </header>

      {editing ? (
        <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
          {members.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <InitialsAvatar initials={member.initials} color={member.avatarColor} className="size-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{member.name}</p>
                <p className="truncate text-caption text-muted-foreground">{member.area ?? "Junta"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {standardRoles.map((role) => (
                  <FilterChip key={role} active={member.role === role} onClick={() => setRole(member.id, role)}>
                    {role}
                  </FilterChip>
                ))}
                <Input
                  value={member.role}
                  onChange={(event) => setRole(member.id, event.target.value)}
                  placeholder="Rol del capítulo…"
                  className="w-48"
                  aria-label={`Rol de ${member.name}`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {president && (
            <section>
              <p className="mb-3 text-small font-medium text-muted-foreground">Presidencia</p>
              <div className="card-surface flex items-center gap-4 rounded-xl border border-border/60 p-5">
                <InitialsAvatar initials={president.initials} color={president.avatarColor} className="size-16 shrink-0 rounded-2xl text-h1" />
                <div className="min-w-0">
                  <p className="text-h3 font-semibold">{president.name}</p>
                  <p className="text-small text-muted-foreground">{president.role}</p>
                </div>
                <StatusBadge tone={tierTone.presidente} className="ml-auto">{tierLabel.presidente}</StatusBadge>
              </div>
            </section>
          )}

          {vp && (
            <section>
              <p className="mb-3 text-small font-medium text-muted-foreground">Vicepresidencia</p>
              <div className="card-surface flex items-center gap-4 rounded-xl border border-border/60 p-4">
                <InitialsAvatar initials={vp.initials} color={vp.avatarColor} className="size-12 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <p className="font-semibold">{vp.name}</p>
                  <p className="text-small text-muted-foreground">{vp.role}</p>
                </div>
                <StatusBadge tone={tierTone.vp} className="ml-auto">VP</StatusBadge>
              </div>
            </section>
          )}

          <section>
            <p className="mb-3 text-small font-medium text-muted-foreground">Junta del capítulo</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {directors.map((director) => (
                <div key={director.id} className="card-surface rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar initials={director.initials} color={director.avatarColor} className="size-10 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{director.name}</p>
                      <p className="truncate text-caption text-muted-foreground">{director.role}{director.area ? ` · ${director.area}` : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <p className="mb-3 flex items-center gap-2 text-small font-medium text-muted-foreground">
          <Users className="size-4 text-brand-purple-light" /> Voluntarios y miembros
        </p>
        <div className="card-surface flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
          <p className="text-small text-muted-foreground">Roster general del capítulo</p>
          <span className="font-semibold">{chapter.volunteers} voluntarios</span>
        </div>
      </section>
    </div>
  );
}