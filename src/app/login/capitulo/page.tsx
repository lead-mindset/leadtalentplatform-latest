import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { LoginDivider, SocialLogin } from "@/components/social-login";

export default function LoginCapituloPage() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 px-6 py-12">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver
      </Link>
      <div className="card-surface mt-4 rounded-xl border border-border/60 p-6">
        <span className="brand-gradient flex size-11 items-center justify-center rounded-xl text-h3 font-black text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="mt-4 text-h2 font-bold tracking-tight">Panel del capítulo</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          Eres estudiante y además parte del e-board. Entra con tu cuenta al panel de tu capítulo: tu comunidad sigue ahí.
        </p>
        <div className="mt-5">
          <SocialLogin route="/admin" label="Entrar" />
          <LoginDivider />
          <LoginForm route="/admin" submitLabel="Entrar con correo" />
        </div>
        <p className="mt-4 text-center text-caption text-muted-foreground">
          <Link href="/inicio" className="font-medium text-brand-purple-light hover:underline">
            Solo quiero mi comunidad
          </Link>
        </p>
      </div>
    </div>
  );
}