import { Suspense } from "react";
import NavHeader from "@/components/global/navigation/NavHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Lock, Zap, Globe, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import TestCrashButton from "@/components/test-button";

export default function Home() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  const steps = [
    { step: '01', title: t('howStep1Title'), desc: t('howStep1Desc') },
    { step: '02', title: t('howStep2Title'), desc: t('howStep2Desc') },
    { step: '03', title: t('howStep3Title'), desc: t('howStep3Desc') },
    { step: '04', title: t('howStep4Title'), desc: t('howStep4Desc') },
  ]

  const benefits = [
    { icon: <Globe className="w-[18px] h-[18px] text-primary" />, title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: <Zap className="w-[18px] h-[18px] text-primary" />, title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: <BadgeCheck className="w-[18px] h-[18px] text-primary" />, title: t('benefit3Title'), desc: t('benefit3Desc') },
  ]

  return (
    <>
      <Suspense fallback={<div>{tCommon('loading')}</div>}>
        <NavHeader />
      </Suspense>

      <main className="overflow-x-hidden bg-background">

        <section className="relative flex min-h-[100svh] flex-col items-center justify-center text-center px-5 sm:px-6">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_-5%,oklch(0.59_0.22_1_/_0.14),transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_110%,oklch(0.59_0.22_1_/_0.05),transparent_70%)]" />
            <svg className="absolute inset-0 h-full w-full opacity-[0.18] dark:opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="currentColor" className="text-border" />
                </pattern>
                <radialGradient id="fade" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>
                <mask id="gridmask">
                  <rect width="100%" height="100%" fill="url(#fade)" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridmask)" />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background to-transparent" />
          </div>
          <TestCrashButton />

          <div className="relative z-10  mx-auto w-full max-w-2xl pt-28 pb-24 sm:pt-28 sm:pb-28">
            <div className="mb-2 flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[18px] border border-border/50 bg-card/60 shadow-xl shadow-black/8 backdrop-blur-sm">
                <Image
                  src="/leadl2.svg"
                  alt={t('logoAlt')}
                  width={44}
                  height={44}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h1 className="mb-5 text-[2.5rem] leading-[1.04] sm:text-[3.5rem] md:text-[4.5rem] font-bold tracking-[-0.03em] text-foreground">
              {t('heroEyebrow')}{' '}
              <span className="bg-gradient-to-b from-primary to-primary/50 bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
            </h1>

            <p className="mx-auto mb-9 max-w-[420px] text-[0.9375rem] leading-[1.7] text-muted-foreground sm:text-base">
              {t('heroSubtitle')}
            </p>

            <Button
              asChild
              size="lg"
              className="h-11 rounded-full px-8 text-[0.8125rem] font-semibold tracking-[-0.01em] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.015] active:scale-[0.99] transition-all duration-200"
            >
              <Link href="/auth/sign-up">
                {t('heroCtaPrimary')}
                <ArrowRight className="ml-2 h-[14px] w-[14px]" />
              </Link>
            </Button>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[t('trustFree'), t('trustPrivate'), t('trustControl')].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground/75">
                  <CheckCircle2 className="h-[11px] w-[11px] shrink-0 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-y border-border/30 py-3.5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent" />
          <div className="relative mx-auto max-w-3xl px-5 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
              <BadgeCheck className="h-[14px] w-[14px] shrink-0 text-primary" />
              <p className="text-[0.8125rem] text-foreground/70 leading-snug">
                {t('memberId')}{' '}
                <span className="font-medium text-primary">{t('memberIdHighlight')}</span>
                {' '}{t('memberIdDesc')}
              </p>
              <Link
                href="/auth/sign-up"
                className="shrink-0 inline-flex items-center gap-1 text-[0.75rem] font-medium text-primary hover:opacity-60 transition-opacity"
              >
                {t('memberIdCta')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative py-24 sm:py-28 md:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_88%_50%,oklch(0.59_0.22_1_/_0.05),transparent)]" />
          <div className="relative mx-auto max-w-5xl px-5 sm:px-6">
            <div className="mb-14 text-center">
              <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-primary/70">
                {t('benefitsTitle')}
              </p>
              <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-[-0.025em] text-foreground">
                {t('benefitsSubtitle')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card/35 hover:shadow-2xl hover:shadow-primary/[0.04] hover:-translate-y-px"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/[0.05] to-transparent" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10">
                      {b.icon}
                    </div>
                    <h3 className="mb-1.5 text-[0.875rem] font-semibold tracking-[-0.01em] text-foreground">
                      {b.title}
                    </h3>
                    <p className="text-[0.75rem] leading-[1.75] text-muted-foreground">
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 sm:py-28 md:py-32 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_12%_50%,oklch(0.59_0.22_1_/_0.05),transparent)]" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-md px-5 sm:px-6">
            <div className="mb-12 text-center">
              <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-primary/70">
                Onboarding
              </p>
              <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-[-0.025em] text-foreground">
                {t('howTitle')}
              </h2>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">
                {t('howSubtitle')}
              </p>
            </div>

            <div>
              {steps.map((item, i) => (
                <div key={item.step} className="relative flex gap-5 pb-7 last:pb-0">
                  {i < steps.length - 1 && (
                    <div className="absolute left-[12px] top-7 bottom-0 w-px bg-gradient-to-b from-border/60 to-border/10" />
                  )}
                  <div className="relative z-10 mt-[1px] flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background text-[9px] font-bold text-primary shadow-sm">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-[0.875rem] font-semibold tracking-[-0.01em] text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 sm:py-28 md:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_55%_at_95%_90%,oklch(0.59_0.22_1_/_0.05),transparent)]" />
          <div className="relative mx-auto max-w-2xl px-5 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/20 p-8 sm:p-10 backdrop-blur-sm">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />
              <div className="relative flex flex-col sm:flex-row gap-5">
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/8">
                  <Lock className="h-[17px] w-[17px] text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-[1.125rem] font-bold tracking-[-0.02em] text-foreground">
                    {t('privacyTitle')}
                  </h2>
                  <p className="mb-5 text-[0.8125rem] leading-[1.75] text-muted-foreground">
                    {t('privacyDesc')}
                  </p>
                  <div className="flex flex-wrap gap-5">
                    {[t('privacyFeature2'), t('privacyFeature3')].map((f) => (
                      <span key={f} className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-28 sm:py-32 md:py-40 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_110%,oklch(0.59_0.22_1_/_0.09),transparent)]" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-sm px-5 sm:px-0">
            <h2 className="mb-3 text-[1.875rem] sm:text-[2.25rem] font-bold tracking-[-0.025em] text-foreground">
              {t('ctaTitle')}
            </h2>
            <p className="mb-9 text-[0.875rem] leading-[1.7] text-muted-foreground">
              {t('ctaSubtitle')}
            </p>
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full px-8 text-[0.8125rem] font-semibold tracking-[-0.01em] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.015] active:scale-[0.99] transition-all duration-200"
            >
              <Link href="/auth/sign-up">
                {t('ctaButton')}
                <ArrowRight className="ml-2 h-[14px] w-[14px]" />
              </Link>
            </Button>
            <p className="mt-5 text-[0.6875rem] tracking-wide text-muted-foreground/60">
              {t('ctaFootnote')}
            </p>
          </div>
        </section>

      </main>
    </>
  );
}