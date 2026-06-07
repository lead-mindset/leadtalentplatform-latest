import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { MainContainer } from "@/components/global/main-container";

const PUBLIC_HERO_VIDEO_PATH = "/video3.mp4";

type HeroProps = {
  locale: string;
};

export function Hero({ locale }: HeroProps) {
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
          "Crea tu perfil, participa en eventos y conecta con tu capítulo cuando estés listo. LEAD reúne estudiantes, líderes y oportunidades en una sola comunidad.",
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
          preload="metadata"
          src={PUBLIC_HERO_VIDEO_PATH}
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_18%,rgba(216,76,197,0.22),transparent_32%),linear-gradient(to_bottom,rgba(9,9,11,0.22),rgba(9,9,11,0.48)_48%,hsl(var(--background)))]" />
      <div className="absolute inset-0 z-[15] bg-background/45 pointer-events-none" />

      <MainContainer className="relative z-20 flex flex-col items-center justify-center py-16">
        <h1 className="fluid-hero text-foreground mb-6">
          {copy.titleLead} <br />
          <span className="inline bg-gradient-to-r from-[#d84cc5] via-[#c53c73] to-[#a92da7] bg-clip-text font-extrabold text-transparent">
            {copy.highlight}
          </span>
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
