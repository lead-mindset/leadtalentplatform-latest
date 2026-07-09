"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { MainContainer } from "@/components/global/main-container";

const CHAPTERS = [
  { name: "Universidad de Lima" },
  { name: "Universidad del Pacífico" },
  { name: "Universidad de Ingeniería y Tecnología (UTEC)" },
  { name: "Universidad San Ignacio de Loyola" },
  { name: "Universidad de Piura" },
  { name: "Universidad Católica San Pablo" },
];

export function ChapterTeaser() {
  const t = useTranslations("homepage");

  return (
    <section className="py-20 sm:py-24 border-b border-border/10 bg-background">
      <MainContainer>
        <div className="text-center mb-12">
          <h2 className="fluid-h2 mb-4">{t("chapterTitle")}</h2>
          <p className="fluid-body text-muted-foreground max-w-2xl mx-auto">
            {t("chapterSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-2xl mx-auto">
          {CHAPTERS.map((chapter) => (
            <span
              key={chapter.name}
              className="inline-block rounded-full border border-border/30 bg-card px-4 py-2 text-sm font-medium text-foreground"
            >
              {chapter.name}
            </span>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" className="rounded-full font-semibold" asChild>
            <Link href="/chapters">{t("chapterCta")}</Link>
          </Button>
        </div>
      </MainContainer>
    </section>
  );
}
