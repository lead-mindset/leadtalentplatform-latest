import { Navbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { Allies } from "./_components/allies";
import { ValueCards } from "./_components/value-cards";
import { CompanyBand } from "./_components/company-band";
import { FinalCTA } from "./_components/final-cta";

import { Footer } from "./_components/footer";

export const metadata = {
  title: 'LEAD Talent Platform',
  description: 'Connect with LEAD events, student talent, and recruiter opportunities.',
}

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen flex flex-col text-foreground antialiased relative overflow-hidden">
      <div className="relative z-10">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <Allies />
          <ValueCards />
          <CompanyBand />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
