import { Navbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { ProofStrip } from "./_components/proofstrip";
import { ValueCards } from "./_components/value-cards";
import { EventsStrip } from "./_components/events-strip";
import { HowItWorks } from "./_components/how-it-works";
import { CompanyBand } from "./_components/company-band";
import { Footer } from "./_components/footer";
import { FinalCTA } from "./_components/final-cta";

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased relative overflow-hidden">

      <div className="relative z-10">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <ProofStrip />
          <ValueCards />
          <EventsStrip />
          <HowItWorks />
          <CompanyBand />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}