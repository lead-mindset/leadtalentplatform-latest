"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { MainContainer } from "@/components/global/main-container";

const PUBLIC_HERO_VIDEO_PATH = "/video3.mp4";

export function Hero() {
  const t = useTranslations("homepage");

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
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_18%,rgba(216,76,197,0.15),transparent_32%),linear-gradient(to_bottom,rgba(9,9,11,0.65),rgba(9,9,11,0.85)_48%,hsl(var(--background)))]" />
      <div className="absolute inset-0 z-[15] bg-background/90 pointer-events-none" />

      <MainContainer className="relative z-20 flex flex-col items-center justify-center py-16">
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
          {t("heroEyebrow")}
        </span>
        <h1 className="fluid-hero text-foreground mb-6">
          {t("heroTitle")}
        </h1>
        <p className="fluid-body-lg text-muted-foreground max-w-3xl mx-auto mb-10 font-medium">
          {t("heroSubtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Button size="lg" className="px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold rounded-full" asChild>
            <Link href="/auth/sign-up">{t("heroCtaPrimary")}</Link>
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold rounded-full" asChild>
            <Link href="/events">{t("heroCtaSecondary")}</Link>
          </Button>
        </div>
      </MainContainer>
    </section>
  );
}
