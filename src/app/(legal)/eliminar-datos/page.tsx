"use client";

import { useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, useForm } from "@/components/form";
import { buildValidate, email, required } from "@/lib/validators";

const validate = buildValidate({
  email: [required("Escribe el correo de tu cuenta"), email()],
});

export default function EliminarDatosPage() {
  const [sent, setSent] = useState(false);
  const form = useForm({
    initial: { email: "" },
    validate,
    onSubmit: () => setSent(true),
  });

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <h1 className="text-h1 font-bold tracking-tight">Borrar mis datos</h1>
      <p className="mt-2 text-small text-muted-foreground">
        Puedes borrar tu perfil y todos tus datos en cualquier momento. Tu visibilidad para empresas
        se desactiva de inmediato y eliminamos tu información en un plazo máximo de 30 días.
      </p>

      {sent ? (
        <Card className="mt-6 shadow-sm">
          <CardContent className="p-(--card-spacing) text-center">
            <CheckCircle2 className="mx-auto size-8 text-success" />
            <p className="mt-3 font-medium">Solicitud recibida</p>
            <p className="mt-1 text-small text-muted-foreground">
              Te escribiremos a {email} para confirmar el borrado. Si cambias de opinión, puedes
              escribirnos a contact@leadmindset.org.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 shadow-sm">
          <CardContent className="p-(--card-spacing)">
            <form onSubmit={form.handleSubmit} className="space-y-4" noValidate>
              <Field label="Correo de tu cuenta" htmlFor="del-email" required error={form.errors.email}>
                <Input id="del-email" type="email" placeholder="tu@correo.com" autoComplete="email" value={form.values.email} onChange={(e) => form.set("email", e.target.value)} />
              </Field>
              <Button type="submit" variant="destructive" className="w-full gap-1.5">
                <Trash2 className="size-4" /> Solicitar borrado de datos
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}