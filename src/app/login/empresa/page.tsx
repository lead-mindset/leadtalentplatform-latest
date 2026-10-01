import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginEmpresaPage() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 px-6 py-12">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver
      </Link>
      <div className="card-surface mt-4 rounded-xl border border-border/60 p-6 text-center">
        <span className="brand-gradient mx-auto flex size-11 items-center justify-center rounded-xl text-h3 font-black text-primary-foreground">
          <Building2 className="size-5" />
        </span>
        <h1 className="mt-4 text-h2 font-bold tracking-tight">Portal de empresas</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          El acceso es solo por invitación de LEAD. Si ya tienes tu invitación, entra con ella.
        </p>
        <Button asChild className="mt-5">
          <Link href="/empresa/login">
            Entrar con mi invitación <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}