import { Suspense } from "react";
import NavHeader from "@/components/global/navigation/NavHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Lock, Zap, Globe, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";

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
    { icon: <Globe className="w-5 h-5 text-primary" />, title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: <Zap className="w-5 h-5 text-primary" />, title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: <BadgeCheck className="w-5 h-5 text-primary" />, title: t('benefit3Title'), desc: t('benefit3Desc') },
  ]

  return (
    <>
      <Suspense fallback={<div>{tCommon('loading')}</div>}>
        <NavHeader />
      </Suspense>

      <main className="min-h-screen bg-background overflow-x-hidden">

        <section className="relative min-h-screen flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 md:pt-32 md:pb-32">
            <div className="max-w-3xl mx-auto text-center space-y-6">

              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-card/60 shadow-lg backdrop-blur-sm">
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

              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('heroEyebrow')}
                </p>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight text-foreground">
                  {t('heroTitle')}
                </h1>
              </div>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
                {t('heroSubtitle')}
              </p>

              <div className="pt-2">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 text-sm font-semibold group shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-shadow"
                >
                  <Link href="/auth/sign-up">
                    {t('heroCtaPrimary')}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center items-center pt-1">
                {[t('trustFree'), t('trustPrivate'), t('trustControl')].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        <section className="border-y border-border/60 bg-primary/5 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
              <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground">
                {t('memberId')}{' '}
                <span className="font-semibold text-primary">{t('memberIdHighlight')}</span>
                {' '}{t('memberIdDesc')}
              </p>
              <Button asChild size="sm" variant="outline" className="flex-shrink-0 h-8 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10">
                <Link href="/auth/sign-up">
                  {t('memberIdCta')}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                  {t('benefitsTitle')}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {t('benefitsSubtitle')}
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {benefits.map((b) => (
                  <div
                    key={b.title}
                    className="group rounded-xl border border-border/60 bg-card/40 p-6 hover:border-primary/40 hover:bg-card/70 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      {b.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5 text-foreground">{b.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                  {t('howTitle')}
                </h2>
                <p className="text-sm text-muted-foreground">{t('howSubtitle')}</p>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-5 bottom-5 w-px bg-border/60 hidden sm:block" />
                <div className="space-y-5">
                  {steps.map((item) => (
                    <div key={item.step} className="relative flex items-start gap-4 sm:pl-12">
                      <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-[10px] font-bold text-primary">
                        {item.step}
                      </div>
                      <div className="pt-1 pb-3">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="rounded-xl border border-border/60 bg-card/40 p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start gap-5">
                  <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-xl mb-2 tracking-tight">
                      {t('privacyTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      {t('privacyDesc')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {[t('privacyFeature2'), t('privacyFeature3')].map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                {t('ctaTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                {t('ctaSubtitle')}
              </p>
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-sm font-semibold group shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-shadow"
              >
                <Link href="/auth/sign-up">
                  {t('ctaButton')}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                {t('ctaFootnote')}
              </p>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}