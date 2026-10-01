"use client";

import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarOption } from "@/components/ui/sidebar-option";
import { InitialsAvatar } from "@/components/initials-avatar";
import { people } from "@/lib/data/people";

const classOptions = ["Todos", "2030", "2029", "2028", "2027", "anteriores"] as const;

function gradYearOf(person: (typeof people)[number]) {
  return person.classYear.replace("Class of ", "");
}

export default function PersonasPage() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<(typeof classOptions)[number]>("Todos");
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const chapters = [...new Set(people.map((person) => person.chapter))].sort();
  const countries = [...new Set(people.map((person) => person.country))].sort();

  const visible = people.filter((person) => {
    const q = query.trim().toLowerCase();
    if (
      q &&
      !(
        person.name.toLowerCase().includes(q) ||
        person.school.toLowerCase().includes(q) ||
        person.headline.toLowerCase().includes(q) ||
        person.major.toLowerCase().includes(q)
      )
    ) {
      return false;
    }
    if (chapterFilter && person.chapter !== chapterFilter) return false;
    if (countryFilter && person.country !== countryFilter) return false;
    if (classFilter === "Todos") return true;
    if (classFilter === "anteriores") return Number(gradYearOf(person)) < 2027;
    return gradYearOf(person) === classFilter;
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <header className="mb-6">
        <h1 className="text-h1 font-bold tracking-tight">Personas</h1>
        <p className="mt-1 text-small text-muted-foreground">
          La red de líderes LEAD en LATAM
        </p>
      </header>

      <div className="flex gap-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 space-y-7">
            <section>
              <h2 className="text-body font-semibold">Graduación</h2>
              <div className="mt-3 space-y-1.5">
                {classOptions.map((option) => (
                  <SidebarOption key={option} active={classFilter === option} onClick={() => setClassFilter(option)}>
                    {option === "anteriores" ? "2026 y anteriores" : option}
                  </SidebarOption>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-body font-semibold">Capítulo</h2>
              <div className="mt-3 space-y-1.5">
                {chapters.map((chapter) => (
                  <SidebarOption key={chapter} active={chapterFilter === chapter} onClick={() => setChapterFilter(chapterFilter === chapter ? null : chapter)}>
                    {chapter}
                  </SidebarOption>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-body font-semibold">País</h2>
              <div className="mt-3 space-y-1.5">
                {countries.map((country) => (
                  <SidebarOption key={country} active={countryFilter === country} onClick={() => setCountryFilter(countryFilter === country ? null : country)}>
                    {country}
                  </SidebarOption>
                ))}
              </div>
            </section>

            <a
              href="/eventos"
              className="block rounded-lg bg-muted/60 px-3 py-3 text-small text-muted-foreground transition-colors hover:text-foreground"
            >
              ¿Interesado en los capítulos de la comunidad?
              <span className="mt-1 flex items-center gap-1 font-medium text-brand-purple-light">
                Ver capítulos <ArrowUpRight className="size-3.5" />
              </span>
            </a>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, universidad o trayectoria…"
              className="rounded-full bg-card pl-9"
              aria-label="Buscar personas"
            />
          </div>

          <div className="mt-5 divide-y divide-border/60">
            {visible.map((person) => (
              <button
                key={person.id}
                type="button"
                className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-card/50"
              >
                <InitialsAvatar initials={person.initials} color={person.avatarColor} className="size-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{person.name}</span>
                    <Badge variant="outline" className="shrink-0 rounded-full text-caption">
                      {person.chapter}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-small text-muted-foreground">
                    • {person.headline} · {person.major} en {person.school}
                  </span>
                  <span className="mt-1 block truncate text-small text-muted-foreground">
                    Graduación {gradYearOf(person)} · {person.school} · {person.major} · {person.country}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}