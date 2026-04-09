import Link from "next/link";

const RECRUITER_LOGIN_URL = "/company/login";
const CONTACT_URL = "mailto:admin@leadmindset.org";

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="
        block text-sm text-muted-foreground
        hover:text-foreground
        transition-colors duration-150
        py-0.5
      "
    >
      {children}
    </Link>
  );
}


export function Footer() {
  return (
    <footer
      className="border-t border-border/60 bg-muted/20"
      aria-label="Pie de página"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">

          <nav aria-label="LEAD">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              LEAD
            </p>
            <div className="flex flex-col gap-0.5">
              <FooterLink href="/about">¿Qué es LEAD?</FooterLink>
              <FooterLink href="/events">Capítulos y eventos</FooterLink>
              <FooterLink href={CONTACT_URL}>Contacto</FooterLink>
            </div>
          </nav>

          <nav aria-label="Estudiantes">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              Estudiantes
            </p>
            <div className="flex flex-col gap-0.5">
              <FooterLink href="/events">Explorar eventos</FooterLink>
              <FooterLink href="/faq">Preguntas frecuentes</FooterLink>

              <div
                className="my-2 h-px bg-border/60"
                aria-hidden="true"
              />

              <FooterLink href="/login?intent=signup">Crear perfil</FooterLink>
              <FooterLink href="/login">Iniciar sesión</FooterLink>
            </div>
          </nav>

          <nav aria-label="Empresas">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              Empresas
            </p>
            <div className="flex flex-col gap-0.5">
              <FooterLink href={CONTACT_URL}>Contactar al equipo</FooterLink>
              <FooterLink href="/about#empresas">¿Cómo funciona?</FooterLink>

              <div
                className="my-2 h-px bg-border/60"
                aria-hidden="true"
              />

              <FooterLink href={RECRUITER_LOGIN_URL}>
                Iniciar sesión como reclutador
              </FooterLink>
            </div>
          </nav>

        </div>

        <div
          className="
            mt-10 pt-6 border-t border-border/60
            flex flex-col sm:flex-row
            items-center justify-between
            gap-3 text-xs text-muted-foreground
          "
        >
          <span>© 2026 LEAD AMERICAS</span>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Términos
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}