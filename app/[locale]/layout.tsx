import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Suspense } from 'react';
import { Lora, Montserrat, Geist_Mono } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
      className={`${montserrat.variable} ${lora.variable} ${geistMono.variable}`}
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
            <LocaleContent params={params}>

              {children}
            </LocaleContent>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}