"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, FolderKanban, ShieldCheck, UserCheck, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminRoleContext, type AdminRole } from "@/lib/admin-role";
import { useCurrentUser } from "@/lib/use-current-user";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const role: AdminRole = user.views.some((view) => view.href === "/board") ? "board" : "chapter";

  const chapterTabs = [
    { href: "/admin", label: "Panel" },
    { href: "/admin/miembros", label: "Miembros" },
    { href: "/admin/validaciones", label: "Validaciones" },
    { href: "/admin/eventos", label: "Eventos" },
    { href: "/admin/financiamiento", label: "Financiamiento" },
  ];
  const boardTabs = [
    { href: "/admin", label: "Panel" },
    { href: "/admin/capitulos", label: "Capítulos" },
    { href: "/admin/miembros", label: "Miembros" },
    { href: "/admin/eventos", label: "Eventos" },
    { href: "/admin/validaciones", label: "Validaciones" },
    { href: "/admin/financiamiento", label: "Financiamiento" },
    { href: "/admin/invitaciones", label: "Invitaciones" },
  ];
  const tabs = role === "chapter" ? chapterTabs : boardTabs;

  return (
    <AdminRoleContext.Provider value={{ role, scope: user.scope }}>
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
          <div aria-hidden className="brand-gradient h-0.5 w-full" />
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
            <div className="flex items-center gap-2.5">
              <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-sm font-black tracking-tight text-primary-foreground">
                L
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-tight">{user.scope}</p>
                <p className="text-caption text-muted-foreground">{user.role} · {role === "chapter" ? "Capítulo" : "E-board global"}</p>
              </div>
            </div>

            <div className="ml-auto">
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-small text-muted-foreground">
                <Link href="/inicio"><ArrowLeft className="size-3.5" /> Volver a la comunidad</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto max-w-7xl overflow-x-auto px-6">
            <Tabs value={pathname} onValueChange={() => {}}>
              <TabsList variant="line" className="w-full border-b border-border">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.href} value={tab.href} asChild className="whitespace-nowrap px-3 py-2 after:bg-brand-purple-light">
                    <Link href={tab.href}>{tab.label}</Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      </div>
    </AdminRoleContext.Provider>
  );
}