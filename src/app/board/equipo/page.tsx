import { StatusBadge } from "@/components/ui/status-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { boardTeam } from "@/lib/data/board";

export default function BoardEquipoPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-bold tracking-tight">Equipo LEAD</h1>
        <p className="mt-1 text-small text-muted-foreground">El board y el liderazgo de la organización.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {boardTeam.map((member) => (
          <div key={member.id} className="card-surface flex items-center gap-4 rounded-xl border border-border/60 p-4">
            <InitialsAvatar initials={member.initials} color={member.avatarColor} className="size-12 shrink-0 rounded-2xl" />
            <div className="min-w-0">
              <p className="font-semibold">{member.name}</p>
              <StatusBadge tone="info" className="mt-1">{member.role}</StatusBadge>
              <p className="mt-1 truncate text-caption text-muted-foreground">{member.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
