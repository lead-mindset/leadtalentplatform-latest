"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

import type { NavLink } from "./nav-links";
import { UserButton } from "./user-button";

type Props = {
  visibleLinks: NavLink[];
  user: { email: string; name?: string | null; role?: Role | null } | null;
  dashboardHref: string;
};

export function NavbarClient({ visibleLinks, user, dashboardHref }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  const isActive = (href: string) => {
    if (href === "/") return pathnameWithoutLocale === "/";
    return pathnameWithoutLocale === href || pathnameWithoutLocale.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="LEAD Talent Platform - inicio"
          >
            <Image
              src="/leadl2.svg"
              alt="LEAD"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="pl-1 text-base font-semibold tracking-tight text-foreground">
              LEAD
            </span>
            <span className="hidden rounded-md border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
              Talent Platform
            </span>
          </Link>

          <nav
            className="hidden flex-1 items-center gap-1 px-2 md:flex"
            aria-label="Navegacion principal"
          >
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive(link.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <UserButton
                email={user.email}
                name={user.name}
                role={user.role}
                dashboardHref={dashboardHref}
              />
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href="/auth/login">Iniciar sesion</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/sign-up">Unirse</Link>
                </Button>
                <Link
                  href="/company/login"
                  className="ml-1 whitespace-nowrap border-l border-border pl-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  Soy empresa -&gt;
                </Link>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-mr-1 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="mx-2 mb-2 flex flex-col gap-3 rounded-b-lg border border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur md:hidden"
          role="dialog"
          aria-label="Menu de navegacion"
        >
          <nav className="grid gap-1" aria-label="Navegacion principal movil">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive(link.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {user ? (
              <UserButton
                email={user.email}
                name={user.name}
                role={user.role}
                dashboardHref={dashboardHref}
              />
            ) : (
              <>
                <Button asChild className="w-full">
                  <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)}>
                    Unirse
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    Iniciar sesion
                  </Link>
                </Button>
                <Link
                  href="/company/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  Soy empresa -&gt;
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
