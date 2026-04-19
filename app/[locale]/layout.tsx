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
import { GoogleMapsProvider } from "@/components/global/google-maps-provider";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const defaultUrl = process.env.FRONTEND_URL
  ? `https://${process.env.FRONTEND_URL}`
  : "http://localhost:3000";

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

  if (!routing.locales.includes(locale as any)) {
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

export default function LocaleLayout({
  children,
  params
}: Props) {
  return (
    <html
      lang={routing.defaultLocale}
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
          <GoogleMapsProvider>
            <Suspense fallback={null}>
              <LocaleContent params={params}>
                {children}
              </LocaleContent>
            </Suspense>
          </GoogleMapsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}