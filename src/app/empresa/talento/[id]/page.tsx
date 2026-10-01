"use client";
import { StatusBadge } from "@/components/ui/status-badge";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, Bookmark, CalendarClock, FileText, GraduationCap, Languages, Mail, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/initials-avatar";
import { talent } from "@/lib/data/talent";
import { useSavedTalent } from "@/lib/use-saved-talent";

export default function TalentoDetallePage() {
  const params = useParams<{ id: string }>();
  const person = talent.find((candidate) => candidate.id === params.id);
  const { saved, toggle } = useSavedTalent();

  if (!person) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 text-center">
        <p className="font-medium">No encontramos este perfil.</p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/empresa">Volver al explorador</Link>
        </Button>
      </div>
    );
  }

  const isSaved = saved.includes(person.id);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <Link href="/empresa" className="text-small font-medium text-brand-purple-light hover:underline">
        ← Explorar talento
      </Link>

      <Card className="mt-4 shadow-sm">
        <CardContent className="p-(--card-spacing)">
          <div className="flex items-center gap-4">
            <InitialsAvatar initials={person.initials} color={person.avatarColor} className="size-16 shrink-0 rounded-2xl text-h1" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-h1 font-bold tracking-tight">{person.name}</h1>
                {person.verified && <BadgeCheck className="size-5 shrink-0 text-brand-purple-light" />}
              </div>
              <p className="text-body-lg text-muted-foreground">{person.headline}</p>
              <p className="mt-1 flex items-center gap-1 text-small text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {person.school} · Grad. {person.graduation} · {person.location} · {person.country}
              </p>
            </div>
            <div className="flex flex-row flex-wrap gap-2 sm:flex-col sm:items-end">
              <StatusBadge tone="info">{person.area}</StatusBadge>
              <Badge variant="outline" className="rounded-full">{person.chapter}</Badge>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-small text-muted-foreground">
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

          <div className="mt-4 flex gap-2">
            <Button size="sm" className="gap-1.5">
              <FileText className="size-3.5" /> Descargar resume
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toggle(person.id)} aria-pressed={isSaved}>
              <Bookmark className={isSaved ? "size-3.5 fill-current" : "size-3.5"} />
              {isSaved ? "Guardado" : "Guardar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 shadow-sm">
        <CardContent className="p-(--card-spacing)">
          <h2 className="text-h3 font-semibold">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {person.skills.map((skill) => (
              <Badge key={skill.name} variant="secondary" className="rounded-full">
                {skill.name}
                <span className="ml-1 font-normal text-muted-foreground">· {skill.level}</span>
              </Badge>
            ))}
          </div>

          <h2 className="mt-6 text-h3 font-semibold">Idiomas</h2>
          <p className="mt-2 flex items-center gap-1.5 text-small text-muted-foreground">
            <Languages className="size-4 shrink-0 text-brand-purple-light" />
            {person.languages.map((lang, i) => (
              <span key={lang.name}>
                {lang.name} · {lang.level}
                {i < person.languages.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4 shadow-sm">
        <CardContent className="p-(--card-spacing)">
          <h2 className="text-h3 font-semibold">Contacto</h2>
          <div className="mt-3 space-y-2 text-small text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-brand-purple-light" />
              {person.name.toLowerCase().replace(/ /g, ".")}@example.com
            </p>
            <p className="flex items-center gap-2">
              <BadgeCheck className="size-4 shrink-0 text-brand-purple-light" />
              Perfil verificado por LEAD
            </p>
          </div>
          <div className="mt-5 border-t border-border/60 pt-4">
            <Button asChild size="sm">
              <Link href="/empresa">Contactar a {person.name.split(" ")[0]}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}