import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { juntas } from "@/lib/data/admin";

export default function BoardCapitulosPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-bold tracking-tight">Capítulos</h1>
        <p className="mt-1 text-small text-muted-foreground">Todas las juntas ejecutivas de LEAD.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {juntas.map((chapter) => {
          const president = chapter.junta.find((member) => member.tier === "presidente");
          const directors = chapter.junta.filter((member) => member.tier === "director");
          return (
            <div key={chapter.chapterId} className="card-surface rounded-xl border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{chapter.name}</p>
                <StatusBadge tone="info">{chapter.region}</StatusBadge>
              </div>
              <p className="mt-1 text-caption text-muted-foreground">{chapter.university}</p>
              {president && <p className="mt-3 text-small text-muted-foreground">{president.role}: <span className="font-medium text-foreground">{president.name}</span></p>}
              <p className="mt-1 text-caption text-muted-foreground">
                {chapter.members} miembros · {directors.length} directores · {chapter.volunteers} voluntarios
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
