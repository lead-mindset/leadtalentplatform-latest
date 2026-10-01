import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { events } from "@/lib/data/community";

export function EventsCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-h3 font-semibold">Próximos eventos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-(--card-spacing) pt-1">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-caption font-bold tracking-wide text-brand-purple-light">{event.month}</span>
              <span className="text-body font-bold leading-none">{event.day}</span>
            </div>
            <div className="min-w-0">
              <p className="text-body font-medium leading-snug">{event.title}</p>
              <p className="text-small text-muted-foreground">{event.location}</p>
            </div>
          </div>
        ))}
        <Link
          href="/eventos"
          className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline"
        >
          Ver todos <ArrowUpRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}