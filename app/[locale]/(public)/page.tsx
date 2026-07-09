import { Navbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { TrustStrip } from "./_components/trust-strip";
import { Allies } from "./_components/allies";
import { ValueCards } from "./_components/value-cards";
import { HowItWorks } from "./_components/how-it-works";
import { ChapterTeaser } from "./_components/chapter-teaser";
import { FinalCTA } from "./_components/final-cta";
import { Footer } from "./_components/footer";

export const metadata = {
  title: 'LEAD Talent Platform',
  description: 'Connect with LEAD events, student talent, and partner company opportunities.',
}

export default async function MarketingHomePage() {
  return (
    <div className="min-h-screen flex flex-col text-foreground antialiased relative overflow-hidden">
      <div className="relative z-10">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <TrustStrip />
          <Allies />
          <ValueCards />
          <HowItWorks />
          <ChapterTeaser />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
