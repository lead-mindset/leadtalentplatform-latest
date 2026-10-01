"use client";
import { StatusBadge } from "@/components/ui/status-badge";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, CalendarClock, Check, ChevronDown, FileText, GraduationCap, Languages, MapPin, Search, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InitialsAvatar } from "@/components/initials-avatar";
import { FilterChip } from "@/components/ui/filter-chip";
import { SidebarOption } from "@/components/ui/sidebar-option";
import { TagInput } from "@/components/tag-input";
import { useSavedTalent } from "@/lib/use-saved-talent";
import { talent, type Talent } from "@/lib/data/talent";

const areaOptions = [...new Set(talent.map((person) => person.area))].sort();
const availabilityOptions = ["Internship", "Full-time"] as const;
const workAuthOptions = ["Local", "Remoto"] as const;
const graduationOptions = [...new Set(talent.map((person) => person.graduation))].sort();
const languageOptions = [...new Set(talent.flatMap((person) => person.languages.map((lang) => lang.name)))].sort();

function workAuthCat(person: Talent) {
  if (person.workAuth.includes("Autorización")) return "Local";
  return "Remoto";
}

function toggleIn(set: Set<string>, value: string) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function TalentCard({
  person,
  activeChips,
  isSaved,
  onToggleSave,
}: {
  person: Talent;
  activeChips: string[];
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-(--card-spacing)">
        <div className="flex items-center gap-4">
          <InitialsAvatar
            initials={person.initials}
            color={person.avatarColor}
            className="size-14 shrink-0 rounded-2xl text-h3"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-bold">{person.name}</p>
              {person.verified && <BadgeCheck className="size-4 shrink-0 text-brand-purple-light" />}
            </div>
            <p className="truncate text-small text-muted-foreground">{person.headline}</p>
          </div>
          <StatusBadge tone="info" className="shrink-0">
            {person.area}
          </StatusBadge>
        </div>

        <p className="mt-2 flex items-center gap-1 truncate text-small text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {person.school} · {person.location} · {person.country}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border/60 pt-3 text-small text-muted-foreground">
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

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-caption font-medium text-muted-foreground">Califica:</span>
            {activeChips.map((chip) => (
              <StatusBadge tone="success" key={chip} className="gap-1">
                <Check className="size-3" /> {chip}
              </StatusBadge>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {person.skills.map((skill) => (
            <Badge key={skill.name} variant="secondary" className="rounded-full">
              {skill.name}
              <span className="ml-1 font-normal text-muted-foreground">· {skill.level}</span>
            </Badge>
          ))}
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-small text-muted-foreground">
          <Languages className="size-3.5 shrink-0 text-brand-purple-light" />
          {person.languages.map((lang, i) => (
            <span key={lang.name}>
              {lang.name} · {lang.level}
              {i < person.languages.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
          <Button size="sm" asChild className="gap-1.5">
            <Link href={`/empresa/talento/${person.id}`}>
              <FileText className="size-3.5" /> Ver perfil
            </Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={onToggleSave} aria-pressed={isSaved}>
            <Bookmark className={isSaved ? "size-3.5 fill-current" : "size-3.5"} />
            {isSaved ? "Guardado" : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmpresaPage() {
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [workAuth, setWorkAuth] = useState<Set<string>>(new Set());
  const [languages, setLanguages] = useState<Set<string>>(new Set());
  const [graduation, setGraduation] = useState<Set<string>>(new Set());
  const { saved, toggle } = useSavedTalent();

  const visible = talent.filter((person) => {
    const q = query.trim().toLowerCase();
    if (
      q &&
      !(
        person.name.toLowerCase().includes(q) ||
        person.school.toLowerCase().includes(q) ||
        person.headline.toLowerCase().includes(q) ||
        person.area.toLowerCase().includes(q) ||
        person.skills.some((skill) => skill.name.toLowerCase().includes(q)) ||
        person.languages.some((lang) => lang.name.toLowerCase().includes(q))
      )
    ) {
      return false;
    }
    if (areas.size > 0 && !areas.has(person.area)) return false;
    if (availability.size > 0 && !availability.has(person.availabilityType)) return false;
    if (skillTags.length > 0 && !person.skills.some((skill) => skillTags.some((tag) => skill.name.toLowerCase().includes(tag.toLowerCase())))) return false;
    if (workAuth.size > 0 && !workAuth.has(workAuthCat(person))) return false;
    if (languages.size > 0 && !person.languages.some((lang) => languages.has(lang.name))) return false;
    if (graduation.size > 0 && !graduation.has(person.graduation)) return false;
    return true;
  });

  const activeChips = [...skillTags, ...areas, ...availability, ...workAuth, ...languages, ...graduation];
  const hasCriteria = activeChips.length > 0;

  const clearChip = (chip: string) => {
    setAreas((prev) => (prev.has(chip) ? toggleIn(prev, chip) : prev));
    setAvailability((prev) => (prev.has(chip as (typeof availabilityOptions)[number]) ? toggleIn(prev, chip) : prev));
    setWorkAuth((prev) => (prev.has(chip as (typeof workAuthOptions)[number]) ? toggleIn(prev, chip) : prev));
    setLanguages((prev) => (prev.has(chip) ? toggleIn(prev, chip) : prev));
    setGraduation((prev) => (prev.has(chip) ? toggleIn(prev, chip) : prev));
    setSkillTags((prev) => prev.filter((tag) => tag !== chip));
  };

  const clearAll = () => {
    setAreas(new Set());
    setAvailability(new Set());
    setWorkAuth(new Set());
    setLanguages(new Set());
    setGraduation(new Set());
    setSkillTags([]);
    setQuery("");
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <header className="mb-6">
        <h1 className="text-h1 font-bold tracking-tight">Encuentra el talento para tu rol</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Talento verificado de la comunidad LEAD en LATAM. Define lo que necesitas y mira quién califica.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Describe tu rol: backend engineer, remoto, inglés, puede empezar en verano…"
          className="h-12 rounded-2xl bg-card pl-12 text-body-lg"
          aria-label="Describir el rol"
        />
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small font-medium text-muted-foreground">Área:</span>
          {areaOptions.map((option) => (
            <FilterChip key={option} active={areas.has(option)} onClick={() => setAreas((prev) => toggleIn(prev, option))}>
              {option}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small font-medium text-muted-foreground">Disponibilidad:</span>
          {availabilityOptions.map((option) => (
            <FilterChip key={option} active={availability.has(option)} onClick={() => setAvailability((prev) => toggleIn(prev, option))}>
              {option}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Button variant="ghost" size="sm" onClick={() => setShowAdvanced((prev) => !prev)} aria-expanded={showAdvanced} className="text-brand-purple-light">
          Requisitos adicionales <ChevronDown className={`size-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </Button>
        {showAdvanced && (
          <div className="mt-3 space-y-4 rounded-xl border border-border/60 card-surface p-(--card-spacing)">
            <div>
              <h2 className="text-body font-semibold">Skills</h2>
              <TagInput
                tags={skillTags}
                onAdd={(tag) => setSkillTags((prev) => [...prev, tag])}
                onRemove={(tag) => setSkillTags((prev) => prev.filter((item) => item !== tag))}
                placeholder="data, frontend, IA…"
                hint="Escribe una skill y presiona Enter. Añade las que necesites."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <h2 className="text-body font-semibold">Autorización</h2>
                <div className="mt-2 space-y-1.5">
                  {workAuthOptions.map((option) => (
                    <SidebarOption
                      key={option}
                      active={workAuth.has(option)}
                      onClick={() => setWorkAuth((prev) => toggleIn(prev, option))}
                    >
                      {option}
                    </SidebarOption>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-body font-semibold">Idiomas</h2>
                <div className="mt-2 space-y-1.5">
                  {languageOptions.map((option) => (
                    <SidebarOption
                      key={option}
                      active={languages.has(option)}
                      onClick={() => setLanguages((prev) => toggleIn(prev, option))}
                    >
                      {option}
                    </SidebarOption>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-body font-semibold">Graduación</h2>
                <div className="mt-2 space-y-1.5">
                  {graduationOptions.map((option) => (
                    <SidebarOption
                      key={option}
                      active={graduation.has(option)}
                      onClick={() => setGraduation((prev) => toggleIn(prev, option))}
                    >
                      {option}
                    </SidebarOption>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <p className="text-small text-muted-foreground">
          <span className="font-semibold text-foreground">{visible.length}</span> de {talent.length} candidatos
          {hasCriteria ? " califican" : ""}
        </p>
        {hasCriteria && (
          <button type="button" onClick={clearAll} className="ml-auto text-small font-medium text-brand-purple-light hover:underline">
            Limpiar todo
          </button>
        )}
      </div>

      {hasCriteria && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <FilterChip key={chip} active onClick={() => clearChip(chip)}>
              {chip} <X className="size-3 text-muted-foreground" />
            </FilterChip>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-4">
        {visible.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <Search className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No encontramos candidatos con esos requisitos</p>
              <p className="mt-1 text-small text-muted-foreground">
                Prueba con menos criterios o contacta a LEAD para ampliar la búsqueda.
              </p>
            </CardContent>
          </Card>
        ) : (
          visible.map((person) => (
            <TalentCard
              key={person.id}
              person={person}
              activeChips={activeChips}
              isSaved={saved.includes(person.id)}
              onToggleSave={() => toggle(person.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}