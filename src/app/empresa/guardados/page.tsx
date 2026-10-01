"use client";
import { StatusBadge } from "@/components/ui/status-badge";

import Link from "next/link";
import { BadgeCheck, Bookmark, CalendarClock, FileText, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/initials-avatar";
import { useSavedTalent } from "@/lib/use-saved-talent";

export default function GuardadosPage() {
  const { savedPeople, toggle } = useSavedTalent();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <header className="mb-6">
        <h1 className="text-h1 font-bold tracking-tight">Talentos guardados</h1>
        <p className="mt-1 text-small text-muted-foreground">
          {savedPeople.length > 0
            ? `${savedPeople.length} candidato${savedPeople.length > 1 ? "s" : ""} guardado${savedPeople.length > 1 ? "s" : ""}.`
            : "Guarda candidatos desde el explorador para revisarlos después."}
        </p>
      </header>

      {savedPeople.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-10 text-center">
            <Bookmark className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Aún no tienes talentos guardados</p>
            <p className="mt-1 text-small text-muted-foreground">
              Explora el talento LEAD y guarda los perfiles que te interesen.
            </p>
            <Button asChild size="sm" className="mt-5">
              <Link href="/empresa">Explorar talento</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedPeople.map((person) => (
            <Card key={person.id} className="shadow-sm">
              <CardContent className="p-(--card-spacing)">
                <div className="flex items-center gap-4">
                  <InitialsAvatar initials={person.initials} color={person.avatarColor} className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold">{person.name}</p>
                      {person.verified && <BadgeCheck className="size-4 shrink-0 text-brand-purple-light" />}
                      <StatusBadge tone="info" className="shrink-0">
                        {person.area}
                      </StatusBadge>
                    </div>
                    <p className="truncate text-small text-muted-foreground">{person.headline}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-small text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      {person.school} · Grad. {person.graduation} · {person.location} · {person.country}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border/60 pt-3 text-small text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 shrink-0 text-brand-purple-light" /> {person.workAuth}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="size-4 shrink-0 text-brand-purple-light" /> {person.availability}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="size-4 shrink-0 text-brand-purple-light" /> Grad. {person.graduation}
                  </span>
                </div>

                <div className="mt-4 flex gap-2 border-t border-border/60 pt-4">
                  <Button size="sm" asChild className="gap-1.5">
                    <Link href={`/empresa/talento/${person.id}`}>
                      <FileText className="size-3.5" /> Ver perfil
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toggle(person.id)} aria-pressed={false}>
                    <Bookmark className="size-3.5 fill-current" /> Guardado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}