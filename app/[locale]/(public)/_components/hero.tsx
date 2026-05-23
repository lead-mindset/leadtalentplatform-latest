"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { MainContainer } from "@/components/global/main-container";
import GradientText from "@/components/ui/gradient-text";
import Aurora from "@/components/ui/aurora";

const PUBLIC_HERO_VIDEO_SRC = "/video3.mp4";

export function Hero() {
  const locale = useLocale();
  const isEnglish = locale === "en";
  const copy = isEnglish
    ? {
        titleLead: "Building Latin America's",
        highlight: "leadership network.",
        body:
          "LEAD connects high-potential students, chapter communities, and partner organizations through events, mentorship, and opt-in talent visibility.",
        primary: "Explore partnership",
        primaryHref: "/partner-info",
        secondary: "View public events",
      }
    : {
        titleLead: "Impulsa tu camino en",
        highlight: "la comunidad LEAD.",
        body:
          "Crea tu perfil, participa en eventos y conecta con tu capitulo cuando estes listo. LEAD reune estudiantes, lideres y oportunidades en una sola comunidad.",
        primary: "Crear perfil",
        primaryHref: "/auth/sign-up",
        secondary: "Explorar eventos",
      };

  return (
    <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          src={PUBLIC_HERO_VIDEO_SRC}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/30 to-background z-10"></div>
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        <Aurora
          colorStops={["#e2315f","#8037c4","#5227FF"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      <div className="absolute w-full h-full inset-0 bg-background opacity-60 z-15 pointer-events-none"></div>

      <MainContainer className="relative z-20 flex flex-col items-center justify-center py-16">
        <h1 className="fluid-hero text-foreground mb-6">
          {copy.titleLead} <br/><GradientText 
            colors={["#d84cc5", "#c53c73", "#a92da7"]}
            animationSpeed={3}
            showBorder={false}
            className="inline font-extrabold"
          >
            {copy.highlight}
          </GradientText>
        </h1>
        <p className="fluid-body-lg text-muted-foreground max-w-3xl mx-auto mb-10 font-medium">
          {copy.body}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Button size="lg" className="px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold rounded-full" asChild>
            <Link href={copy.primaryHref}>{copy.primary}</Link>
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold rounded-full" asChild>
            <Link href="/events">{copy.secondary}</Link>
          </Button>
        </div>
      </MainContainer>
    </section>
  );
}
