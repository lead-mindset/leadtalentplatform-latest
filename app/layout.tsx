import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Raleway } from "next/font/google";
import NavHeader from "@/components/global/navigation/NavHeader";

const outfit = Raleway({ subsets: ['latin'], variable: '--font-sans' });

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "LEAD Talent Platform",
  description: "talent platform",
};

const ralewaySans = Raleway({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className={`${ralewaySans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NavHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
