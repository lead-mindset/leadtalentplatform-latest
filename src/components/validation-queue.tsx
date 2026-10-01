"use client";

import { useState } from "react";
import { BadgeCheck, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Chip } from "@/components/ui/chip";
import { InitialsAvatar } from "@/components/initials-avatar";
import { FilterChip } from "@/components/ui/filter-chip";
import { profileReviews, type ProfileReview } from "@/lib/data/admin";

type Status = ProfileReview["status"];

const matchesScope = (review: ProfileReview, scope: "chapter" | "global" | "no-chapter", chapter: string) =>
  scope === "no-chapter" ? review.chapter === "" : scope === "chapter" ? review.chapter === chapter : true;

export function ValidationQueue({ chapter = "", scope }: { chapter?: string; scope: "chapter" | "global" | "no-chapter" }) {
  const [reviews, setReviews] = useState<ProfileReview[]>(profileReviews.map((r) => ({ ...r })));
  const [tab, setTab] = useState<Status>("pending");

  const pendingCount = reviews.filter((r) => r.status === "pending" && matchesScope(r, scope, chapter)).length;
  const filtered = reviews.filter((r) => r.status === tab && matchesScope(r, scope, chapter));

  const setStatus = (id: string, status: Status) =>
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const subtitle =
    scope === "no-chapter"
      ? "Perfiles sin capítulo (fuera de América Latina). Los valida el equipo global de LEAD."
      : scope === "chapter"
      ? `Solo ves los perfiles de ${chapter}. Los de otros capítulos los revisa su propio e-board.`
      : "Todos los perfiles pendientes de validar, de cualquier capítulo.";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold tracking-tight">Validaciones</h1>
          <p className="mt-1 max-w-xl text-small text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 text-small text-muted-foreground">
          <span className="size-2 rounded-full bg-brand-purple-light" />
          {pendingCount} por validar
        </div>
      </header>

      <div className="flex gap-1.5">
        <FilterChip active={tab === "pending"} onClick={() => setTab("pending")}>Pendientes</FilterChip>
        <FilterChip active={tab === "approved"} onClick={() => setTab("approved")}>Aprobados</FilterChip>
        <FilterChip active={tab === "rejected"} onClick={() => setTab("rejected")}>Rechazados</FilterChip>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface rounded-xl border border-border/60 p-8 text-center text-small text-muted-foreground">
          No hay perfiles {tab === "pending" ? "por validar" : tab === "approved" ? "aprobados" : "rechazados"} aquí.
        </div>
      ) : (
        <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
          {filtered.map((review) => (
            <div key={review.id} className="flex flex-wrap items-start gap-4 px-4 py-4">
              <InitialsAvatar initials={review.initials} color={review.avatarColor} className="size-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{review.name}</p>
                  {review.chapter ? (
                    <StatusBadge tone="info">{review.chapter}</StatusBadge>
                  ) : (
                    <StatusBadge tone="muted">Sin capítulo</StatusBadge>
                  )}
                </div>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {review.university} · {review.major} · {review.year} · enviado {review.submitted}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {review.skills.map((skill) => (
                    <Chip key={skill} tone={review.topSkills.includes(skill) ? "brand" : "muted"}>
                      {review.topSkills.includes(skill) ? `★ ${skill}` : skill}
                    </Chip>
                  ))}
                </div>
                {review.status === "approved" && (
                  <p className="mt-2 flex items-center gap-1.5 text-caption font-medium text-success">
                    <BadgeCheck className="size-3.5" /> Aprobado · visible para empresas
                  </p>
                )}
              </div>
              {review.status === "pending" ? (
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" className="gap-1" onClick={() => setStatus(review.id, "approved")}>
                    <Check className="size-3.5" /> Aprobar
                  </Button>
                  <Button size="sm" variant="destructive-outline" onClick={() => setStatus(review.id, "rejected")}>
                    <X className="size-3.5" /> Rechazar
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus(review.id, "pending")}>
                    <RotateCcw className="size-3.5" /> Deshacer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}