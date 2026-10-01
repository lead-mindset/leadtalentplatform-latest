import Link from "next/link";
import { Topbar } from "@/components/topbar";

export default function ComunidadLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      {children}
      <footer className="mt-12 border-t border-border/60 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-small text-muted-foreground">
          <p>© 2026 LEAD · Empoderando estudiantes de las Américas</p>
          <nav className="flex flex-wrap gap-5">
            <Link href="/recursos" className="hover:text-foreground">
              Recursos
            </Link>
            <Link href="/empresa/login" className="hover:text-foreground">
              Para empresas
            </Link>
            <a href="mailto:contact@leadmindset.org" className="hover:text-foreground">
              Contacto
            </a>
            <Link href="/privacidad" className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-foreground">
              Términos
            </Link>
            <Link href="/cookies" className="hover:text-foreground">
              Cookies
            </Link>
            <Link href="/eliminar-datos" className="hover:text-foreground">
              Borrar mis datos
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}