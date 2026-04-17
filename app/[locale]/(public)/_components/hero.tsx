import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import Image from "next/image";

const TRUST_ITEMS = [
  "Privado por defecto",
  "Tú controlas tu visibilidad",
  "Gratis",
] as const;

export function Hero() {
  return (
    <section
      className="
        relative overflow-hidden
       text-card-foreground bg-background
        border-b border-border/60
      "
      aria-labelledby="hero-heading"
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.59_0.22_1/0.12),transparent)]
        "
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20  text-center">


        <div className="relative mb-6 mx-auto flex h-[68px] w-[68px] items-center justify-center
    rounded-[18px] border border-border/50
    overflow-hidden shadow-xl shadow-black/8">
          <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
          <Image
            src="/leadl2.svg"
            alt="logo"
            width={44}
            height={44}
            className="relative z-10 object-contain"
            priority
          />
        </div>

        <h1
          id="hero-heading"
          className="
            text-4xl sm:text-5xl lg:text-6xl
            font-semibold leading-[1.1] tracking-tight
            text-foreground
            mb-5
          "
        >
          Conecta con oportunidades exclusivas de {" "}
          <span className="text-primary"> LEAD</span>
        </h1>


        <ul
          className="
            flex flex-wrap items-center justify-center
            gap-x-5 gap-y-2
            mb-8
          "
          aria-label="Garantías de la plataforma"
        >
          {TRUST_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Icons.CheckCircle2
                className="text-success shrink-0"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>

        <div
          className="
            flex flex-col sm:flex-row
            items-center justify-center
            gap-3
          "
        >
          <Button
            asChild
            size="lg"
            className="
              w-full sm:w-auto
              font-semibold text-base
              bg-primary text-primary-foreground
              hover:bg-primary/90
              px-8
            "
          >
            <Link href="/auth/sign-up">
              Crear mi perfil&nbsp;{`→`}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="
              w-full sm:w-auto
              font-medium text-base
              px-8
            "
          >
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </div>

      </div>
    </section>
  );
}