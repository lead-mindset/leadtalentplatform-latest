import { BookOpen, FileText, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resourceCategories } from "@/lib/data/library";

const icons = [Lightbulb, BookOpen, FileText];

export default function RecursosPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <header className="mb-6">
        <h1 className="text-h1 font-bold tracking-tight">Biblioteca de recursos</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Guías, conocimiento y plantillas construidos por y para la comunidad LEAD.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {resourceCategories.map((category, i) => {
          const Icon = icons[i % icons.length];
          return (
            <Card key={category.name} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-h3 font-semibold">
                  <Icon className="size-4 text-brand-purple-light" /> {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-(--card-spacing) pt-1">
                {category.items.map((item) => (
                  <div key={item.title}>
                    <p className="text-body font-medium leading-snug">{item.title}</p>
                    <p className="mt-0.5 text-small text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}