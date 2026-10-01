import Link from "next/link";
import { ArrowRight, Building2, Landmark, TrendingUp, Users } from "lucide-react";
import { boardInsights, boardKpis } from "@/lib/data/board";
import { juntas } from "@/lib/data/admin";

export default function BoardOverviewPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-small text-muted-foreground">
          La salud de LEAD a nivel organización. Decide, no operes.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {boardInsights.map((insight) => (
          <div key={insight.title} className="card-surface rounded-xl border border-border/60 p-4">
            <p className="text-small font-medium text-muted-foreground">{insight.title}</p>
            <p className="mt-2 text-display font-bold leading-none">{insight.value}</p>
            <p className="mt-1 text-caption text-muted-foreground">{insight.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-h3 font-semibold">
              <Users className="size-4 text-brand-purple-light" /> Capítulos
            </h2>
            <Link href="/board/capitulos" className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline">
              Ver todos <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
            {juntas.slice(0, 3).map((chapter) => {
              const president = chapter.junta.find((member) => member.tier === "presidente");
              return (
                <div key={chapter.chapterId} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{chapter.name}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {president ? `${president.role}: ${president.name}` : "Sin presidente"}
                    </p>
                  </div>
                  <span className="shrink-0 text-caption text-muted-foreground">{chapter.members} miembros</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-h3 font-semibold">
              <Landmark className="size-4 text-brand-purple-light" /> Financiamiento
            </h2>
            <Link href="/board/financiamiento" className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline">
              Revisar <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="card-surface rounded-xl border border-border/60 p-5">
            <p className="text-small font-medium text-muted-foreground">Solicitudes por aprobar</p>
            <p className="mt-2 text-display font-bold leading-none">{boardKpis.fundingPending}</p>
            <p className="mt-2 text-caption text-muted-foreground">
              El board decide los fondos de los capítulos.
            </p>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-h3 font-semibold">
          <Building2 className="size-4 text-brand-purple-light" /> Empresas
        </h2>
        <div className="card-surface flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 p-5">
          <div>
            <p className="font-medium">Portal empresa · talento LEAD</p>
            <p className="mt-1 text-caption text-muted-foreground">
              {boardKpis.pendingInvites} invitaciones pendientes · {boardKpis.members} miembros con talento visible.
            </p>
          </div>
          <Link href="/board/invitaciones" className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline">
            Gestionar invitaciones <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}