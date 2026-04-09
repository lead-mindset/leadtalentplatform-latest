import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * FinalCTA — Closing conversion section
 *
 * UX decisions (from audit):
 * - Chapter network angle: "Presente en 14 universidades del Perú"
 *   Closes on the most concrete, verifiable stat.
 *   "Tu capítulo ya está aquí" makes it personal — the student's specific
 *   university is in the network.
 * - Does NOT repeat the hero copy ("Conecta con empresas...").
 *   The final CTA closes the loop; it does not re-open the premise.
 * - Trust strip repeated at the point of decision (Gratis · Privado · 5 min).
 *   Reassurance exactly where needed — immediately below the CTA.
 * - Single CTA only. The user has seen the full page; they don't need
 *   a secondary "Iniciar sesión" here — that's the nav's job.
 *
 * PROOF_CHAPTERS must stay in sync with LEAD_CHAPTER_VALUES in constants.ts.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

/** Must match number of entries in LEAD_CHAPTER_VALUES (constants.ts). */
const PROOF_CHAPTERS = 14;

const FINAL_TRUST_ITEMS = ["Gratis", "Privado por defecto", "5 minutos"] as const;


export function FinalCTA() {
  return (
    <section
      className="
        relative overflow-hidden
        py-20 sm:py-28
        bg-card border-b border-border/60
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