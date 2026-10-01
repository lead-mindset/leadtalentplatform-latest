import { Chip } from "@/components/ui/chip";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, CalendarDays, Check, MapPin, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/initials-avatar";
import { AsciiText } from "@/components/ascii-text";
import { events } from "@/lib/data/community";
import { people } from "@/lib/data/people";
import { talent } from "@/lib/data/talent";

const stats = [
  { value: "13", label: "capítulos universitarios" },
  { value: "2", label: "países · LATAM" },
  { value: "100+", label: "estudiantes en Discover Day" },
];

const featuredEvents = events.filter((event) => ["Discover Day 2027", "Día de la comunidad LEAD"].includes(event.title));
const featuredPeople = people.slice(0, 3);
const preview = talent[0];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6">
      <header className="flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-sm font-black tracking-tight text-primary-foreground">
            L
          </span>
          <span className="text-lg font-bold tracking-tight">LEAD</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/empresa"
            className="hidden rounded-md px-3 py-1.5 text-small font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-block"
          >
            Para empresas
          </Link>
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-1.5 text-small font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-block"
          >
            Iniciar sesión
          </Link>
          <Button asChild size="sm">
            <Link href="/perfil">Crear mi perfil</Link>
          </Button>
        </nav>
      </header>

      <section className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="text-small font-medium text-brand-purple-light">Empoderando estudiantes de las Américas</p>
          <h1 className="mt-4 text-display font-bold tracking-tight">
            Tu talento,{" "}
            <AsciiText text="encontrado" className="text-brand-purple-light" /> por las empresas
          </h1>
          <p className="mt-5 max-w-md text-body-lg text-muted-foreground">
            Únete a la red de líderes LEAD. Crea tu perfil en 2 minutos y deja que las empresas te
            encuentren en LATAM
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-1.5">
              <Link href="/perfil">
                Crear mi perfil en 2 minutos <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/eventos">Explorar los eventos</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {featuredPeople.map((person) => (
                <InitialsAvatar
                  key={person.id}
                  initials={person.initials}
                  color={person.avatarColor}
                  className="size-9 ring-2 ring-background"
                />
              ))}
            </div>
            <p className="text-small text-muted-foreground">
              Únete a {people.length}+ miembros y sé visible para empresas
            </p>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="relative rounded-2xl border border-border/60 card-surface p-(--card-spacing) shadow-xl">
            <div className="brand-gradient absolute inset-x-8 top-0 h-px" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <InitialsAvatar initials={preview.initials} color={preview.avatarColor} className="size-12 shrink-0 rounded-2xl" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-bold">{preview.name}</p>
                  <BadgeCheck className="size-4 shrink-0 text-brand-purple-light" />
                </div>
                <p className="truncate text-small text-muted-foreground">{preview.headline}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-small text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-brand-purple-light" /> {preview.workAuth}
              </p>
              <p className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-brand-purple-light" /> {preview.availability}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {preview.skills.slice(0, 4).map((skill) => (
                <Chip key={skill.name}>{skill.name}</Chip>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4">
              <span className="flex items-center gap-1.5 text-caption font-medium text-success">
                <Check className="size-3.5" /> Visible para empresas
              </span>
              <Button size="sm" className="ml-auto">
                Ver perfil
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 divide-x divide-border/60 border-y border-border/60 py-7">
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 text-center first:pl-0 last:pr-0">
            <p className="text-h1 font-bold leading-none">{stat.value}</p>
            <p className="mt-1.5 text-small text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="py-16">
        <p className="text-center text-small font-medium text-muted-foreground">
          Empresas que confían en el talento LEAD
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-h3 font-bold tracking-tight text-muted-foreground/70">
          {["Microsoft", "Google", "AWS", "ALPFA", "SHPE"].map((company) => (
            <span key={company} className="transition-colors hover:text-foreground">
              {company}
            </span>
          ))}
        </div>
      </section>

      <section className="py-20">
        <h2 className="text-h2 font-semibold">¿Qué puedes hacer en LEAD?</h2>
        <p className="mt-1 text-small text-muted-foreground">Una comunidad para crecer, y un perfil para que te encuentren.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/eventos", icon: CalendarDays, title: "Explorar eventos", text: "Workshops, paneles y networking de tu capítulo y de toda LEAD." },
            { href: "/perfil", icon: UserPlus, title: "Crear tu perfil", text: "En 2 minutos, y las empresas pueden encontrarte." },
            { href: "/personas", icon: Users, title: "Conocer personas", text: "Únete a los líderes LEAD en LATAM" },
            { href: "/empresa", icon: Building2, title: "Para empresas", text: "Talento verificado de la comunidad LEAD." },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="card-surface group rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-purple-light/30">
              <action.icon className="size-5 text-brand-purple-light" />
              <p className="mt-3 font-semibold">{action.title}</p>
              <p className="mt-1 text-caption text-muted-foreground">{action.text}</p>
              <ArrowRight className="mt-3 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-purple-light" />
            </Link>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h2 font-semibold">Eventos de la comunidad</h2>
            <p className="mt-1 text-small text-muted-foreground">Empieza por un evento, quédate por la red.</p>
          </div>
          <Link href="/eventos" className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline">
            Ver todos <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          {featuredEvents.map((event) => (
            <article key={event.id}>
              {event.image ? (
                <img
                  src={event.image}
                  alt={`${event.title} — evento de la comunidad LEAD`}
                  className="aspect-banner w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-banner w-full items-center justify-center rounded-2xl bg-muted">
                  <CalendarDays className="size-8 text-brand-purple-light" />
                </div>
              )}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-caption font-medium text-brand-purple-light">
                  <span>{event.month}</span>
                  <span>·</span>
                  <span>{event.day}</span>
                  <span>·</span>
                  <span>{event.type}</span>
                </div>
                <h3 className="mt-1.5 text-h3 font-semibold">{event.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-small text-muted-foreground">
                  <MapPin className="size-3.5" /> {event.location}
                </p>
                <p className="mt-2 text-small text-muted-foreground">{event.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-20">
        <h2 className="text-h2 font-semibold">Únete a ellos</h2>
        <p className="mt-1 text-small text-muted-foreground">
          Líderes LEAD en el mundo. Tu perfil te pone en el mapa.
        </p>
        <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-3">
          {featuredPeople.map((person) => (
            <div key={person.id} className="flex items-center gap-4">
              <InitialsAvatar initials={person.initials} color={person.avatarColor} className="size-12 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{person.name}</p>
                <p className="truncate text-small text-muted-foreground">{person.school} · {person.country}</p>
                <p className="truncate text-small text-brand-purple-light">{person.chapter}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-20">
        <h2 className="text-h2 font-semibold">LEAD en los medios</h2>
        <p className="mt-1 text-small text-muted-foreground">
          De Lima al mundo: presencia en eventos y cobertura de la comunidad.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "RAISE Summit 2026", place: "Hackathon en París · ContextCore" },
            { title: "ALPFA Dallas", place: "Liderazgo y diversidad en tech" },
            { title: "#SFTechWeek", place: "San Francisco · Talent tech" },
            { title: "Discover Day UTEC", place: "100+ estudiantes, 13 capítulos" },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border/60 bg-card/40 px-4 py-4">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-caption text-muted-foreground">{item.place}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="brand-gradient mb-20 rounded-3xl px-8 py-14 text-center">
        <h2 className="mx-auto max-w-lg text-h1 font-bold tracking-tight text-white">
          Las empresas ya buscan talento LEAD
        </h2>
        <p className="mx-auto mt-3 max-w-md text-small text-white/85">
          Perfil verificado + resume + idiomas y disponibilidad. Así es como te encuentran.
        </p>
        <Button asChild size="lg" className="mt-6 gap-1.5 bg-white text-foreground hover:bg-white/90">
          <Link href="/perfil">
            Crear mi perfil ahora <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}