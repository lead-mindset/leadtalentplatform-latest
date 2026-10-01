"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, useForm } from "@/components/form";
import { buildValidate, email, minLen, required } from "@/lib/validators";

const validate = buildValidate({
  email: [required("Escribe tu correo corporativo"), email()],
  password: [required(), minLen(6)],
});

export default function EmpresaLoginPage() {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string>();
  const form = useForm({
    initial: { email: "", password: "" },
    validate,
    onSubmit: () => {
      if (!consent) {
        setConsentError("Debes aceptar los términos y la política de privacidad.");
        return;
      }
      router.push("/empresa");
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="size-4 text-brand-purple-light" />
            <span className="text-small font-medium">Acceso para empresas</span>
          </div>
          <h1 className="mt-3 text-h1 font-bold tracking-tight">Portal Empresa</h1>
          <p className="mt-1 text-small text-muted-foreground">
            El acceso es por invitación. Entra con el correo de tu invitación.
          </p>

          <form onSubmit={form.handleSubmit} className="mt-6 space-y-4" noValidate>
            <Field label="Correo corporativo" htmlFor="em-email" required error={form.errors.email}>
              <Input id="em-email" type="email" placeholder="tu@empresa.com" autoComplete="email" value={form.values.email} onChange={(e) => form.set("email", e.target.value)} />
            </Field>
            <Field label="Contraseña" htmlFor="em-password" required error={form.errors.password}>
              <Input id="em-password" type="password" placeholder="••••••••" autoComplete="current-password" value={form.values.password} onChange={(e) => form.set("password", e.target.value)} />
            </Field>
            <div>
              <label className="flex items-start gap-2 text-small text-muted-foreground">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => {
                    setConsent(checked === true);
                    if (checked) setConsentError(undefined);
                  }}
                  aria-invalid={!!consentError || undefined}
                  className="mt-0.5"
                />
                <span>
                  Acepto los{" "}
                  <a href="/terminos" className="font-medium text-brand-purple-light hover:underline">términos</a>{" "}
                  y la{" "}
                  <a href="/privacidad" className="font-medium text-brand-purple-light hover:underline">política de privacidad</a>.
                </span>
              </label>
              {consentError && <p className="mt-1 text-caption text-destructive-light" role="alert">{consentError}</p>}
            </div>
            <Button type="submit" className="w-full gap-1.5">
              Entrar al portal <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-5 text-small text-muted-foreground">
            ¿Quieres acceder al talento LEAD?{" "}
            <Link href="/empresa/ayuda" className="font-medium text-brand-purple-light hover:underline">
              Conoce cómo funciona
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}