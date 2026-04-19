import { Navbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { ProofStrip } from "./_components/proofstrip";
import { ValueCards } from "./_components/value-cards";
import { CompanyBand } from "./_components/company-band";
import { FinalCTA } from "./_components/final-cta";
import { ChaptersMap } from "./_components/chapters-map";
import { Leadership } from "./_components/leadership";
import { Gallery } from "./_components/gallery";
import { Footer } from "./_components/footer";

export const metadata = {
  title: 'LEAD Talent Platform',
  description: 'Connect with LEAD events, student talent, and recruiter opportunities.',
}

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen flex flex-col text-foreground antialiased relative overflow-hidden bg-background">
      <div className="relative z-10">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <ProofStrip />
          <ValueCards />
          <CompanyBand />
          <FinalCTA />
          <ChaptersMap />
          <Leadership />
          <Gallery />
        </main>
        <Footer />
      </div>
    </div>
  );
}
