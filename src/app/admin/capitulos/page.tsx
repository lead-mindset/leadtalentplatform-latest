import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { juntas } from "@/lib/data/admin";

export default function AdminCapitulosPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-bold tracking-tight">Capítulos</h1>
        <p className="mt-1 text-small text-muted-foreground">
          La red de capítulos de LEAD, con sus juntas ejecutivas.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {juntas.map((chapter) => {
          const president = chapter.junta.find((member) => member.tier === "presidente");
          return (
            <Link
              key={chapter.chapterId}
              href={`/admin/capitulos/${chapter.chapterId}`}
              className="card-surface group rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-purple-light/30"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{chapter.name}</p>
                <StatusBadge tone="info">{chapter.region}</StatusBadge>
              </div>
              <p className="mt-1 text-caption text-muted-foreground">{chapter.university}</p>
              {president && (
                <p className="mt-3 flex items-center gap-1.5 text-small text-muted-foreground">
                  <Users className="size-3.5 text-brand-purple-light" />
                  {president.role}: <span className="font-medium text-foreground">{president.name}</span>
                </p>
              )}
              <p className="mt-1 text-caption text-muted-foreground">
                {chapter.members} miembros · {chapter.junta.length} en la junta
              </p>
              <p className="mt-3 flex items-center gap-1 text-small font-medium text-brand-purple-light">
                Ver junta <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}