"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "lead-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = (value: string) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 p-4 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-4">
        <Cookie className="size-5 shrink-0 text-brand-purple-light" />
        <p className="min-w-0 flex-1 text-small text-muted-foreground">
          Usamos cookies esenciales para que la plataforma funcione. No usamos cookies de publicidad.
          Lee nuestra{" "}
          <Link href="/cookies" className="font-medium text-brand-purple-light hover:underline">
            política de cookies
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => accept("essentials")}>
            Solo esenciales
          </Button>
          <Button size="sm" onClick={() => accept("all")}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}