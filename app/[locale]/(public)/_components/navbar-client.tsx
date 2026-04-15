"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UserButton } from "./user-button";
import type { NavLink } from "./nav-links";
import type { Role } from "@/lib/types";

type Props = {
  visibleLinks: NavLink[];
  user: { email: string; name?: string | null; role?: Role | null } | null;
  dashboardHref: string;
};

export function NavbarClient({ visibleLinks, user, dashboardHref }: Props) {
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
            <Image src="/leadl2.svg" alt="LEAD" width={44} height={44} className="object-contain" priority />
            <span className="text-base pl-1 font-semibold tracking-tight text-foreground">LEAD</span>
            <span className="hidden sm:inline text-[10px] font-medium text-muted-foreground border border-foreground/15 rounded-full px-2 py-0.5 tracking-wide uppercase">
              Talent Platform
            </span>
          </Link>

          <nav className="hidden md:flex px-2 items-center flex-1 gap-1" aria-label="Navegación principal">
            {visibleLinks.map((link) => (
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
            {user ? (
              <UserButton
                email={user.email}
                name={user.name}
                role={user.role}
                dashboardHref={dashboardHref}
              />
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="font-medium">
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm" className="font-medium">
                  <Link href="/auth/sign-up">Unirse</Link>
                </Button>
                <Link
                  href="/company/login"
                  className="text-xs text-muted-foreground pl-3 ml-1 border-l border-foreground/15 hover:text-foreground transition-colors duration-150 whitespace-nowrap"
                >
                  Soy empresa&nbsp;→
                </Link>
              </>
            )}
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
          className="md:hidden bg-background/90 backdrop-blur-md px-4 py-4 flex flex-col gap-3 ring-1 ring-foreground/8 rounded-b-2xl mx-2 mb-2"
          role="dialog"
          aria-label="Menú de navegación"
        >
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-foreground/10 pt-3 flex flex-col gap-3">
            {user ? (
              <UserButton
                email={user.email}
                name={user.name}
                role={user.role}
                dashboardHref={dashboardHref}
              />
            ) : (
              <>
                <Button asChild className="w-full font-medium">
                  <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)}>Unirse</Link>
                </Button>
                <Button asChild variant="outline" className="w-full font-medium">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Iniciar sesión</Link>
                </Button>
                <Link
                  href="/company/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-center text-muted-foreground py-2 hover:text-foreground transition-colors"
                >
                  Soy empresa&nbsp;→
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}