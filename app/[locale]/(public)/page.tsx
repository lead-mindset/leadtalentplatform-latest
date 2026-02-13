import { Suspense } from "react";
import NavHeader from "@/components/global/navigation/NavHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, TrendingUp, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from 'next-intl';

export default function Home() {

  console.log('Env check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)
  });


  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <>
      <Suspense fallback={<div>{tCommon('loading')}</div>}>
        <NavHeader />
      </Suspense>

      <main className="min-h-screen bg-background">
        <section className="relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-8 overflow-hidden">
                <Image
                  src="/leadl2.svg"
                  alt={t('logoAlt')}
                  width={64}
                  height={64}
                  className="object-cover"
                  priority
                />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-muted-foreground leading-relaxed">
                {t('heroSubtitle')}
              </p>
              <Button size="lg" className="text-lg px-8 py-6 h-auto font-semibold group mb-8 bg-primary text-primary-foreground">
                {t('heroCtaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex flex-wrap gap-6 justify-center items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{t('trustFree')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{t('trustPrivate')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{t('trustControl')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  {t('benefitsTitle')}
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6 pb-6 px-6">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/10">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {t('benefit1Title')}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t('benefit1Desc')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6 pb-6 px-6">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/10">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {t('benefit2Title')}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t('benefit2Desc')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6 pb-6 px-6">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/10">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {t('benefit3Title')}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t('benefit3Desc')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                      <Shield className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-2xl md:text-3xl mb-3">
                        {t('privacyTitle')}
                      </h2>
                      <p className="text-lg mb-6 text-muted-foreground leading-relaxed">
                        {t('privacyDesc')}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{t('privacyFeature2')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{t('privacyFeature3')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('ctaTitle')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('ctaSubtitle')}
              </p>
              <Button size="lg" className="text-lg px-8 py-6 h-auto font-semibold group bg-primary text-primary-foreground">
                {t('ctaButton')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
