"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Eventos", href: "/events" },
] as const;

function LangToggle() {
  return (
    <button
      aria-label="Cambiar idioma"
      className="text-xs font-medium text-muted-foreground border border-foreground/15 rounded-full px-2.5 py-1.5 hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-all duration-150 tracking-wide"
    >
      ES&nbsp;/&nbsp;EN
    </button>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md ring-1 ring-foreground/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">

          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-full"
            aria-label="LEAD Talent Platform — inicio"
          >
            <Image
              src="/leadl2.svg"
              alt="LEAD"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
            <span className="text-base pl-1 font-semibold tracking-tight text-foreground">
              LEAD
            </span>
            <span className="hidden sm:inline text-[10px] font-medium text-muted-foreground border border-foreground/15 rounded-full px-2 py-0.5 tracking-wide uppercase">
              Talent Platform
            </span>
          </Link>

          <nav className="hidden md:flex px-2 items-center flex-1 gap-1" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground px-3 py-1.5 rounded-full hover:text-foreground hover:bg-foreground/8 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="font-medium">
              <Link href="/login">Iniciar sesión</Link>
            </Button>

            <Button asChild size="sm" className="font-medium">
              <Link href="/sign-up">Unirse</Link>
            </Button>

            <Link
              href="/company/login"
              className="text-xs text-muted-foreground pl-3 ml-1 border-l border-foreground/15 hover:text-foreground transition-colors duration-150 whitespace-nowrap"
            >
              Soy empresa&nbsp;→
            </Link>
          </div>

          <button
            className="md:hidden p-2 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-all"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden bg-background/90 backdrop-blur-md px-4 py-4 flex flex-col gap-3 ring-1 ring-foreground/8 ring-t-0 rounded-b-2xl mx-2 mb-2"
          role="dialog"
          aria-label="Menú de navegación"
        >
          <Button asChild className="w-full font-medium">
            <Link href="/login?intent=signup" onClick={() => setMobileOpen(false)}>
              Unirse
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full font-medium">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              Iniciar sesión
            </Link>
          </Button>

          <Link
            href="#para-empresas"
            onClick={() => setMobileOpen(false)}
            className="text-sm text-center text-muted-foreground py-2 border-t border-foreground/10 hover:text-foreground transition-colors"
          >
            Soy empresa&nbsp;→
          </Link>

          <div className="flex justify-center pt-1">
            <LangToggle />
          </div>
        </div>
      )}
    </header>
  );
}