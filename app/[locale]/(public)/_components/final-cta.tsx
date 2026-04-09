import Link from "next/link";
import { Button } from "@/components/ui/button";

const PROOF_CHAPTERS = 14;

const FINAL_TRUST_ITEMS = ["Gratis", "Privado por defecto", "5 minutos"] as const;


export function FinalCTA() {
  return (
    <section
      className="
        relative overflow-hidden
        py-20 sm:py-28 bg-background/80
        text-center
      "
      aria-labelledby="final-cta-heading"
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_70%_50%_at_50%_110%,oklch(0.59_0.22_1/0.10),transparent)]
        "
      />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6">

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Red LEAD · Perú
        </p>

        <h2
          id="final-cta-heading"
          className="
            text-3xl sm:text-4xl font-semibold tracking-tight
            text-foreground mb-3
          "
        >
          Presente en {PROOF_CHAPTERS} universidades del Perú
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed mb-8">
          Tu capítulo ya está aquí. Crea tu perfil y forma parte de la red.
        </p>

        <Button
          asChild
          size="lg"
          className="
            font-semibold text-base
            bg-primary text-primary-foreground
            hover:bg-primary/90
            px-10
          "
        >
          <Link href="/login?intent=signup">Crear mi perfil&nbsp;→</Link>
        </Button>

      
      </div>
    </section>
  );
}