import { Briefcase, BadgeCheck, EyeOff } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";
import { SectionLabel } from "@/components/ui/section-label";
import { Icon } from "@/components/ui/icon";
import PrismaticBurst from "@/components/ui/prismatic-burst";

const VALUE_CARDS = [
  {
    icon: Briefcase,
    title: "Accede a oportunidades reales",
    description:
      "Empresas buscan talento LEAD activamente. Tu perfil llega a ellos cuando estás listo.",
  },
  {
    icon: BadgeCheck,
    title: "Tu Member ID oficial",
    description:
      "Obtén tu número único como miembro LEAD — tu credencial para eventos y la comunidad. Generado automáticamente.",
  },
  {
    icon: EyeOff,
    title: "Tú controlas quién te ve",
    description:
      "Privado por defecto. Activa tu visibilidad cuando quieras. Cámbialo en cualquier momento.",
  },
] as const;

export function ValueCards() {
  return (
    <section className="py-24 bg-background overflow-hidden relative border-b border-border/10">
      <div className="absolute bg-background inset-0 z-0">
        <PrismaticBurst
          animationType="rotate3d"
          intensity={1.9}
          speed={0.1}
          distort={1.0}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={24}
          mixBlendMode="lighten"
          colors={['#e2315f', '#8037c4', '#4220c9']}
        />
      </div>
      <MainContainer className="relative z-10">
        <div className="text-center mb-16">
          <SectionLabel>LEAD Talent Platform</SectionLabel>
          <h2 className="fluid-h2 mb-6">
            Your Fast-Track to Global Tech
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUE_CARDS.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-card border border-border/30 p-8 sm:p-10 rounded-[2rem] hover:bg-muted/50 hover:border-primary/40 hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon icon={CardIcon} size="md" variant="accent" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </MainContainer>
    </section>
  );
}