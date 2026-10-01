"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BadgeCheck, Building2, FolderKanban, Landmark, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { href: "/board", label: "Overview", icon: FolderKanban },
  { href: "/board/capitulos", label: "Capítulos", icon: Users },
  { href: "/board/validaciones", label: "Validaciones", icon: BadgeCheck },
  { href: "/board/financiamiento", label: "Financiamiento", icon: Landmark },
  { href: "/board/invitaciones", label: "Invitaciones", icon: Building2 },
  { href: "/board/equipo", label: "Equipo", icon: Users },
];

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
          <div aria-hidden className="brand-gradient h-0.5 w-full" />
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
          <div className="flex items-center gap-2.5">
            <span className="brand-gradient flex size-8 items-center justify-center rounded-lg text-sm font-black tracking-tight text-primary-foreground">
              L
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">LEAD Board</p>
              <p className="text-caption text-muted-foreground">Fundadores · estratégico</p>
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
  );
}