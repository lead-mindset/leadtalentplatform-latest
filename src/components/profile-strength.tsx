import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profile } from "@/lib/data/profile";

const checklist = [
  { key: "resume", label: "Sube tu currículum" },
  { key: "languages", label: "Agrega tus idiomas" },
  { key: "workAuth", label: "Autorización de trabajo" },
  { key: "skills", label: "Agrega al menos 3 skills" },
];

const done = {
  resume: profile.cv.uploaded,
  languages: profile.languages.length > 0,
  workAuth: profile.workAuth.trim().length > 0,
  skills: profile.skills.length >= 3,
};

export function ProfileStrength() {
  const completed = checklist.filter((item) => done[item.key as keyof typeof done]).length;
  const percent = Math.round((completed / checklist.length) * 100);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3 font-semibold">Completa tu perfil</CardTitle>
          <span className="text-small font-semibold text-brand-purple-light">{percent}%</span>
        </div>
      </CardHeader>
      <CardContent className="p-(--card-spacing) pt-2">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Completitud del perfil"
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div className="brand-progress h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-small text-muted-foreground">
          Lo que las empresas ven primero. Tu currículum es lo más importante.
        </p>
        <ul className="mt-4 space-y-2">
          {checklist.map((item) => {
            const isDone = done[item.key as keyof typeof done];
            const Icon = isDone ? CheckCircle2 : Circle;
            return (
              <li key={item.key} className="flex items-center gap-2 text-small">
                <Icon className={`size-4 shrink-0 ${isDone ? "text-success" : "text-muted-foreground"}`} />
                <span className={isDone ? "text-muted-foreground" : "text-foreground"}>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}