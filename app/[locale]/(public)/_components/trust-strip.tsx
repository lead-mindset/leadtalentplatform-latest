"use client";

import { useTranslations } from "next-intl";

export function TrustStrip() {
  const t = useTranslations("homepage");

  return (
    <section className="bg-muted border-y border-border/60" aria-label="LEAD network stats">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-stretch justify-center divide-y sm:divide-y-0 sm:divide-x divide-border/30">
          <div className="flex flex-col items-center justify-center py-5 px-8 sm:px-12 text-center gap-0.5">
            <span className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums leading-none">
              {t("trustStatChaptersNum")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("trustStatChaptersLabel")}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-5 px-8 sm:px-12 text-center gap-0.5">
            <span className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums leading-none">
              {t("trustStatMembersNum")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("trustStatMembersLabel")}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-5 px-8 sm:px-12 text-center gap-0.5">
            <span className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums leading-none">
              {t("trustStatTimeNum")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("trustStatTimeLabel")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
