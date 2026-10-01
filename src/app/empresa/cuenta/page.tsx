import { StatusBadge } from "@/components/ui/status-badge";
import { BadgeCheck, Building2, CalendarClock, Check, FileText, ShieldCheck, UserRound, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/initials-avatar";
import { companyAccount, tierExplainer } from "@/lib/data/company";

export default function CuentaPage() {
  const { company, recruiter, access, seats } = companyAccount;
  const tierItems = tierExplainer[access.tier];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <header className="mb-8">
        <h1 className="text-h1 font-bold tracking-tight">Hola, {recruiter.name.split(" ")[0]}.</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Aquí ves tu empresa, tu nivel de acceso y hasta cuándo puedes usar el portal.
        </p>
      </header>

      <section className="rounded-xl border border-border/60 card-surface p-(--card-spacing)">
        <div className="flex items-center gap-4">
          <InitialsAvatar initials={company.initials} color={company.avatarColor} className="size-14 shrink-0 rounded-2xl text-h3" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3 font-semibold">{company.name}</h2>
              <StatusBadge tone="info">{company.partnership}</StatusBadge>
            </div>
            <p className="text-small text-muted-foreground">
              <Building2 className="mr-1 inline size-3.5" />
              {company.industry} · {company.location}
            </p>
          </div>
          <StatusBadge tone="success">Acceso activo</StatusBadge>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-border/60 card-surface p-(--card-spacing)">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-brand-purple-light" />
          <h2 className="text-h3 font-semibold">Tu acceso</h2>
        </div>
        <p className="mt-1 text-small text-muted-foreground">
          LEAD te invitó a encontrar talento. Esto es lo que puedes hacer:
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {tierItems.map((item, i) => (
            <div key={item.label} className="rounded-lg bg-muted/40 px-4 py-3">
              <p className="flex items-center gap-1.5 text-small font-medium">
                <Check className="size-4 shrink-0 text-success" /> {item.label}
              </p>
              <p className="mt-1 text-caption text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 border-t border-border/60 pt-5 text-small text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <CalendarClock className="size-4 shrink-0 text-brand-purple-light" />
            <span>
              Acceso válido hasta:{" "}
              <span className="font-medium text-foreground">30 de junio de 2027</span>
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-brand-purple-light" />
            <span>
              Invitaciones:{" "}
              <span className="font-medium text-foreground">
                {seats.used} de {seats.total} usadas
              </span>
            </span>
          </p>
        </div>

        <p className="mt-5 rounded-lg bg-muted/40 px-4 py-3 text-caption text-muted-foreground">
          Tu acceso es por invitación y puede revocarse si es necesario. No lo compartas: cada descarga
          de resume queda registrada.
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-border/60 card-surface p-(--card-spacing)">
        <div className="flex items-center gap-2">
          <UserRound className="size-4 text-brand-purple-light" />
          <h2 className="text-h3 font-semibold">Tu contacto en LEAD</h2>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <InitialsAvatar initials={recruiter.name.split(" ").map((word) => word[0]).join("").slice(0, 2)} color="brand-rose" className="size-11" />
          <div>
            <p className="font-semibold">{recruiter.name}</p>
            <p className="text-small text-muted-foreground">{recruiter.role} · {recruiter.email}</p>
          </div>
        </div>
      </section>
    </div>
  );
}