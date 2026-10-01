import { FileText, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { profile } from "@/lib/data/profile";

export function CvCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-h3 font-semibold">Currículum (CV)</CardTitle>
      </CardHeader>
      <CardContent className="p-(--card-spacing) pt-2">
        <p className="text-small text-muted-foreground">
          Sube tu currículum para que las empresas puedan verlo.
        </p>

        {profile.cv.uploaded ? (
          <div className="mt-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
              <FileText className="size-4 shrink-0 text-brand-purple-light" />
              <span className="min-w-0 flex-1 truncate text-small font-medium">{profile.cv.name}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Ver currículum">
                <FileText />
              </Button>
              <Button variant="destructive-ghost" size="icon-sm" aria-label="Eliminar currículum">
                <Trash2 />
              </Button>
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-small font-medium text-brand-purple-light transition-colors hover:bg-muted">
              <Upload className="size-4" />
              Seleccionar nuevo currículum
              <input type="file" className="sr-only" accept=".pdf,.doc,.docx" />
            </label>
            <p className="mt-2 text-caption text-muted-foreground">PDF, DOC o DOCX. Máximo 10MB</p>
          </div>
        ) : (
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-small font-medium text-brand-purple-light transition-colors hover:bg-muted">
            <Upload className="size-4" />
            Subir currículum
            <input type="file" className="sr-only" accept=".pdf,.doc,.docx" />
          </label>
        )}
      </CardContent>
    </Card>
  );
}