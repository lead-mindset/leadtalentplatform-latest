"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InitialsAvatar } from "@/components/initials-avatar";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "cn";

const baseNav = [
  { label: "Comunidad", href: "/inicio" },
  { label: "Eventos", href: "/eventos" },
  { label: "Personas", href: "/personas" },
];

export function Topbar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);

  const adminLinks = user.views
    .filter((view) => view.href === "/admin" || view.href === "/board")
    .map((view) => ({
      label: view.href === "/board" ? "Board" : "Panel",
      href: view.href,
      special: true,
    }));
  const nav = [...baseNav, ...adminLinks];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
        <Link href="/inicio" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-sm font-black tracking-tight text-primary-foreground">
            L
          </span>
          <span className="text-lg font-bold tracking-tight">LEAD</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-small font-medium transition-colors",
                  item.special
                    ? active
                      ? "bg-brand-purple/20 font-semibold text-brand-purple-light"
                      : "bg-brand-purple/15 text-brand-purple-light hover:bg-brand-purple/20"
                    : active
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar personas, universidades…"
              className="h-9 w-64 rounded-full border-border/60 bg-card pl-9"
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Notificaciones">
            <Bell />
          </Button>
          <Link href="/perfil" aria-label="Mi perfil">
            <InitialsAvatar initials={user.initials} color={user.avatarColor} className="cursor-pointer" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur md:hidden" aria-label="Menú móvil">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-body font-medium transition-colors",
                  item.special
                    ? active
                      ? "bg-brand-purple/20 text-brand-purple-light"
                      : "bg-brand-purple/15 text-brand-purple-light hover:bg-brand-purple/20"
                    : active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}