"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, useForm } from "@/components/form";
import { buildValidate, email, required } from "@/lib/validators";

const validate = buildValidate({
  email: [required(), email()],
  password: [required("Escribe tu contraseña")],
});

export function LoginForm({ route, submitLabel }: { route: string; submitLabel: string }) {
  const router = useRouter();
  const form = useForm({ initial: { email: "", password: "" }, validate, onSubmit: () => router.push(route) });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-3" noValidate>
      <Field label="Correo" htmlFor="lf-email" required error={form.errors.email}>
        <Input id="lf-email" type="email" autoComplete="email" value={form.values.email} onChange={(e) => form.set("email", e.target.value)} />
      </Field>
      <Field label="Contraseña" htmlFor="lf-password" required error={form.errors.password}>
        <Input id="lf-password" type="password" autoComplete="current-password" value={form.values.password} onChange={(e) => form.set("password", e.target.value)} />
      </Field>
      <Button type="submit" className="w-full">
        {submitLabel} <ArrowRight className="size-3.5" />
      </Button>
    </form>
  );
}