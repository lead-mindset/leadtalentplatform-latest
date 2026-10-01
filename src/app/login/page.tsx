import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { LoginDivider, SocialLogin } from "@/components/social-login";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="text-center">
        <span className="brand-gradient mx-auto flex size-12 items-center justify-center rounded-2xl text-h2 font-black tracking-tight text-primary-foreground">
          L
        </span>
        <h1 className="mt-4 text-h1 font-bold tracking-tight">Bienvenida a LEAD</h1>
        <p className="mx-auto mt-2 max-w-md text-small text-muted-foreground">
          Inicia sesión o crea tu perfil en 2 minutos. Las empresas te encuentran por tus skills.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card-surface flex flex-col justify-between rounded-xl border border-brand-purple-light/40 bg-brand-purple/5 p-6">
          <div>
            <GraduationCap className="size-6 text-brand-purple-light" />
            <p className="mt-3 font-semibold">¿Eres estudiante?</p>
            <p className="mt-1 text-caption text-muted-foreground">
              Arma tu perfil con tus skills, proyectos y experiencia. Las empresas te buscan por eso.
            </p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/perfil/nuevo">
              Crear mi perfil <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="card-surface rounded-xl border border-border/60 p-6">
          <p className="font-semibold">¿Ya tienes cuenta?</p>
          <p className="mt-1 text-caption text-muted-foreground">Inicia sesión para entrar a tu comunidad.</p>
          <div className="mt-4">
            <SocialLogin route="/inicio" label="Entrar" />
            <LoginDivider />
            <LoginForm route="/inicio" submitLabel="Iniciar sesión" />
          </div>
        </div>
      </div>
    </div>
  );
}