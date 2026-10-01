import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/initials-avatar";
import { people } from "@/lib/data/people";

export function PeopleCard() {
  const suggested = people.slice(0, 3);
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-h3 font-semibold">Personas sugeridas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-(--card-spacing) pt-1">
        {suggested.map((person) => (
          <Link key={person.id} href={`/perfil/${person.id}`} className="flex items-center gap-3">
            <InitialsAvatar initials={person.initials} color={person.avatarColor} />
            <div className="min-w-0">
              <p className="truncate text-body font-medium">{person.name}</p>
              <p className="truncate text-small text-muted-foreground">
                {person.school}
              </p>
            </div>
          </Link>
        ))}
        <Link
          href="/personas"
          className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline"
        >
          Ver comunidad <ArrowUpRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}