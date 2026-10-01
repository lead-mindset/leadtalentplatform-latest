import Link from "next/link";
import { ArrowUpRight, BookOpen, GraduationCap, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resources } from "@/lib/data/profile";

const icons = [BookOpen, GraduationCap, Award];

export function ResourcesCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-h3 font-semibold">Recursos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-(--card-spacing) pt-1">
        {resources.map((resource, i) => {
          const Icon = icons[i % icons.length];
          return (
            <Link key={resource.title} href={resource.href} className="group flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-brand-purple-light">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-body font-medium leading-snug group-hover:underline">
                  {resource.title}
                </span>
                <span className="block text-small text-muted-foreground">{resource.description}</span>
              </span>
            </Link>
          );
        })}
        <Link
          href="/recursos"
          className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline"
        >
          Ver biblioteca <ArrowUpRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}