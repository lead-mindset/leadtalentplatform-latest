import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users } from "lucide-react";


const CONTACT_FORM_URL = "mailto:admin@leadmindset.org";

const COMPANY_FEATURES = [
  {
    icon: ShieldCheck,
    text: "Perfiles verificados por capítulo LEAD",
  },
  {
    icon: Users,
    text: "Solo ves estudiantes que optaron por ser visibles",
  },
] as const;

export function CompanyBand() {
  return (
    <section
      id="para-empresas"
      className="
        py-16 sm:py-20
        border-y border-border/60
        bg-muted/30
      "
      aria-labelledby="company-band-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-1 h-5 rounded-none bg-primary"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Para empresas
              </span>
            </div>

            <h2
              id="company-band-heading"
              className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3"
            >
              Encuentra talento universitario comprometido en Perú
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Accede a perfiles verificados de estudiantes LEAD. Solo ves
              quienes optaron por ser visibles — sin perfiles genéricos.
            </p>

            <ul className="flex flex-col gap-3" aria-label="Características para empresas">
              {COMPANY_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.text} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <Icon size={15} className="text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {feature.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-0">

            <div
              className="
                rounded-xl border border-border
                bg-card p-6
                flex flex-col gap-4
                shadow-sm
              "
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-card-foreground">
                  ¿Quieres contratar talento LEAD?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  El acceso de reclutadores es por invitación. Escríbenos y
                  te contamos cómo empezar — sin compromiso.
                </p>
              </div>

              <Button
                asChild
                className="
                  w-full sm:w-auto self-start
                  font-semibold
                  bg-primary text-primary-foreground
                  hover:bg-primary/90
                "
              >
                <Link href={CONTACT_FORM_URL}>
                  Contactar al equipo LEAD&nbsp;→
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-4 pl-1">
              <p className="text-xs text-muted-foreground">
                ¿Ya tienes acceso de reclutador?
              </p>
              <Link
                href={'company/login'}
                className="
                  text-xs font-medium text-primary
                  hover:underline underline-offset-2
                  transition-colors
                "
              >
                Iniciar sesión&nbsp;→
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}