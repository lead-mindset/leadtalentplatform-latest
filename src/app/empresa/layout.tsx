"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = [
    { href: "/empresa", label: "Explorar talento" },
    { href: "/empresa/guardados", label: "Guardados" },
    { href: "/empresa/ayuda", label: "Ayuda" },
    { href: "/empresa/cuenta", label: "Mi cuenta" },
  ];
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
          <div className="flex items-center gap-2.5">
            <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-sm font-black tracking-tight text-primary-foreground">
              L
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Portal Empresa</p>
              <p className="text-caption text-muted-foreground">Talento LEAD</p>
            </div>
          </div>

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Portal empresa">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-small font-medium transition-colors ${
                    active ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-small text-muted-foreground">
              <Link href="/empresa/login">
                <LogOut className="size-3.5" /> Cerrar sesión
              </Link>
            </Button>
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
          <nav className="border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur md:hidden" aria-label="Menú móvil del portal">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-body font-medium transition-colors ${
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/empresa/login"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-body font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cerrar sesión
            </Link>
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}