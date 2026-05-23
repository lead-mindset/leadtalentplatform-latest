"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_HERO_VIDEO_SRC = "/video3.mp4";

export function FinalCTA() {
  const locale = useLocale() === "en" ? "en" : "es";
  const copy = locale === "en"
    ? {
        title: "Build with the next generation of Latin American leaders.",
        body:
          "Explore LEAD's public activity, then contact the team to discuss sponsorships, events, or company access.",
        primary: "Partner with LEAD",
        primaryHref: "/partner-info",
        secondary: "Explore events",
        secondaryHref: "/events",
      }
    : {
        title: "Unete al siguiente paso de LEAD.",
        body:
          "Crea tu perfil, participa en eventos y postula a un capitulo cuando estes listo.",
        primary: "Crear perfil",
        primaryHref: "/auth/sign-up",
        secondary: "Explorar LEAD",
        secondaryHref: "/events",
      };

  return (
    <section className="p-4 sm:p-6 lg:p-8 h-screen">
      <div className="bg-background w-full h-full rounded-[2rem] relative overflow-hidden shadow-2xl">
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
        
        <div className="absolute inset-0 bg-black/60 z-1"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-end p-8 sm:p-12 md:p-16 lg:p-24">
          <div className="max-w-4xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              {copy.title}
            </h2>
            <p className="text-white/80 text-lg sm:text-xl md:text-2xl font-medium mb-12 max-w-2xl">
              {copy.body}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild
                size="lg"
                className="px-8 py-6 text-base sm:text-lg rounded-full font-bold hover:scale-105 hover:shadow-2xl transition-all group bg-white text-background hover:bg-white/90"
              >
                <Link href={copy.primaryHref}>
                  {copy.primary}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-6 text-base sm:text-lg rounded-full font-bold hover:scale-105 transition-all group border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={copy.secondaryHref}>
                  {copy.secondary}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
