import { Briefcase, BadgeCheck, EyeOff } from "lucide-react";

const VALUE_CARDS = [
  {
    icon: Briefcase,
    iconClass: "text-info",
    iconBg: "bg-info-muted",
    title: "Accede a oportunidades reales",
    description:
      "Empresas buscan talento LEAD activamente. Tu perfil llega a ellos cuando estás listo.",
    primary: true,
  },
  {
    icon: BadgeCheck,
    iconClass: "text-success",
    iconBg: "bg-success-muted",
    title: "Tu Member ID oficial",
    description:
      "Obtén tu número único como miembro LEAD — tu credencial para eventos y la comunidad. Generado automáticamente.",
    primary: false,
  },
  {
    icon: EyeOff,
    iconClass: "text-warning",
    iconBg: "bg-warning-muted",
    title: "Tú controlas quién te ve",
    description:
      "Privado por defecto. Activa tu visibilidad cuando quieras. Cámbialo en cualquier momento.",
    primary: false,
  },
] as const;

export function ValueCards() {
  return (
    <section
      className="py-16 sm:py-20 border-b border-border/60"
      aria-labelledby="value-cards-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10 sm:mb-12">
          <h2
            id="value-cards-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
          >
            Tres razones para unirte hoy
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {VALUE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`
                  relative rounded-xl border p-6 bg-card
                  flex flex-col gap-4
                  transition-shadow duration-200
                  hover:shadow-sm
                  ${card.primary
                    ? "border-border shadow-sm"
                    : "border-border/60"
                  }
                `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-lg
                    flex items-center justify-center
                    ${card.iconBg}
                    shrink-0
                  `}
                  aria-hidden="true"
                >
                  <Icon size={20} className={card.iconClass} />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-card-foreground leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}