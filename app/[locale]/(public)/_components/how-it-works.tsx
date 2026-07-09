"use client";

import { useTranslations } from "next-intl";

const STEPS = [
  { number: 1, titleKey: "howStep1Title", descKey: "howStep1Desc" },
  { number: 2, titleKey: "howStep2Title", descKey: "howStep2Desc" },
  { number: 3, titleKey: "howStep3Title", descKey: "howStep3Desc" },
  { number: 4, titleKey: "howStep4Title", descKey: "howStep4Desc" },
  { number: 5, titleKey: "howStep5Title", descKey: "howStep5Desc" },
] as const;

export function HowItWorks() {
  const t = useTranslations("homepage");

  return (
    <section
      className="py-16 sm:py-20 border-b border-border/60"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10 sm:mb-12">
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
          >
            {t("howTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("howSubtitle")}
          </p>
        </div>

        <ol className="flex flex-col" aria-label="Steps to join LEAD">
          {STEPS.map((step, index) => {
            const isLast = index === STEPS.length - 1;
            return (
              <li
                key={step.number}
                className="flex gap-5 pb-0"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="
                      w-8 h-8 rounded-full
                      flex items-center justify-center
                      border border-border
                      bg-background
                      text-xs font-semibold text-muted-foreground
                      shrink-0 z-10
                    "
                    aria-hidden="true"
                  >
                    {step.number}
                  </div>
                  {!isLast && (
                    <div
                      className="flex-1 w-px bg-border/60 my-1.5"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className={`flex-1 pt-1 ${!isLast ? "pb-6" : "pb-0"}`}>
                  <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

      </div>
    </section>
  );
}
