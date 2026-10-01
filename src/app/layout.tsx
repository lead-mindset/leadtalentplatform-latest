import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import { AmbientBackground } from "@/components/ambient-background";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ViewAs } from "@/components/view-as";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LEAD Comunidad",
  description: "La comunidad de LEAD: personas, eventos y oportunidades.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <AmbientBackground />
        <SmoothScroll />
        {children}
        <CookieConsent />
        <ViewAs />
      </body>
    </html>
  );
}