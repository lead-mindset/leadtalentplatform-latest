"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_HERO_VIDEO_PATH = "/video3.mp4";

export function FinalCTA() {
  const [videoSrc, setVideoSrc] = useState<string | undefined>();
  const t = useTranslations("homepage");

  useEffect(() => {
    setVideoSrc(new URL(PUBLIC_HERO_VIDEO_PATH, window.location.origin).toString());
  }, []);

  return (
    <section className="p-4 sm:p-6 lg:p-8 h-screen">
      <div className="bg-background w-full h-full rounded-[2rem] relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            src={videoSrc}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-black/80 z-1"></div>

        <div className="relative z-10 h-full flex flex-col justify-end p-8 sm:p-12 md:p-16 lg:p-24">
          <div className="max-w-4xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              {t("ctaTitle")}
            </h2>
            <p className="text-white/80 text-lg sm:text-xl md:text-2xl font-medium mb-12 max-w-2xl">
              {t("ctaBody")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="px-8 py-6 text-base sm:text-lg rounded-full font-bold hover:scale-105 hover:shadow-2xl transition-all group bg-white text-background hover:bg-white/90"
              >
                <Link href="/auth/sign-up">
                  {t("ctaButton")}
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
