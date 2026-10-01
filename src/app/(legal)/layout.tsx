import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center gap-6 border-b border-border/60">
        <div className="mx-auto flex w-full max-w-3xl items-center px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-sm font-black tracking-tight text-primary-foreground">
              L
            </span>
            <span className="text-lg font-bold tracking-tight">LEAD</span>
          </Link>
          <div className="ml-auto">
            <Button asChild size="sm">
              <Link href="/perfil">Crear mi perfil</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="mt-auto border-t border-border/60 py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 text-small text-muted-foreground">
          <p>© 2026 LEAD</p>
          <nav className="flex flex-wrap gap-5">
            <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
            <Link href="/terminos" className="hover:text-foreground">Términos</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/reembolsos" className="hover:text-foreground">Reembolsos</Link>
            <Link href="/eliminar-datos" className="hover:text-foreground">Borrar mis datos</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}