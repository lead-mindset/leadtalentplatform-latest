import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Suspense } from 'react';
import { Raleway, Montserrat } from "next/font/google";
import { getConfiguredAppUrl } from "@/lib/app-url";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const defaultUrl = getConfiguredAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "LEAD Talent Platform",
  description: "talent platform",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function LocaleContent({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Toaster />
      {children}
    </NextIntlClientProvider>
  );
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;
  const htmlLang = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  return (
    <html
      lang={htmlLang}
      className={` ${raleway.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <LocaleContent params={Promise.resolve({ locale: htmlLang })}>
              {children}
            </LocaleContent>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
