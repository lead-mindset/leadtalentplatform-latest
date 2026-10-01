import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/initials-avatar";
import { me } from "@/lib/data/people";

export function ProfileCard() {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-(--card-spacing)">
        <div className="flex items-center gap-3">
          <InitialsAvatar initials={me.initials} color={me.avatarColor} className="size-12" />
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{me.name}</p>
            <p className="text-small text-muted-foreground">{me.headline}</p>
          </div>
        </div>

        <div className="mt-4 text-body">
          <p className="font-medium">{me.school}</p>
          <p className="text-muted-foreground">
            {me.classYear} · {me.major}
          </p>
          <p className="mt-1 text-muted-foreground">{me.location}</p>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-small text-muted-foreground">
          <span className="size-2 shrink-0 rounded-full bg-success" />
          Tu perfil es visible para empresas
        </div>

        <Button variant="secondary" className="mt-4 w-full">
          Editar perfil
        </Button>
      </CardContent>
    </Card>
  );
}