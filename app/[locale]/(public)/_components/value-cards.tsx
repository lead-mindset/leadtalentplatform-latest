"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, Briefcase, EyeOff } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";
import { SectionLabel } from "@/components/ui/section-label";
import { Icon } from "@/components/ui/icon";
import PrismaticBurst from "@/components/ui/prismatic-burst";

const CARDS = [
  { icon: BadgeCheck, titleKey: "valueCard1Title", descKey: "valueCard1Desc" },
  { icon: Briefcase, titleKey: "valueCard2Title", descKey: "valueCard2Desc" },
  { icon: EyeOff, titleKey: "valueCard3Title", descKey: "valueCard3Desc" },
] as const;

export function ValueCards() {
  const t = useTranslations("homepage");

  return (
    <section className="relative overflow-hidden border-b border-border/10 bg-background py-24">
      <div className="absolute inset-0 z-0 bg-background">
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
          colors={["#e2315f", "#8037c4", "#4220c9"]}
        />
      </div>
      <MainContainer className="relative z-10">
        <div className="mb-16 text-center">
          <SectionLabel>{t("valueEyebrow")}</SectionLabel>
          <h2 className="fluid-h2 mb-6">{t("valueTitle")}</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {CARDS.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.titleKey}
                className="group rounded-[2rem] border border-border/30 bg-card p-8 transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:bg-muted/50 sm:p-10"
              >
                <div className="mb-6 transition-transform duration-300 group-hover:scale-110">
                  <Icon icon={CardIcon} size="md" variant="accent" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-foreground transition-colors group-hover:text-primary sm:text-2xl">
                  {t(card.titleKey)}
                </h3>
                <p className="leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
                  {t(card.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </MainContainer>
    </section>
  );
}
