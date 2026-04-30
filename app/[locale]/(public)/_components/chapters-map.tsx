import Link from "next/link";
import { Building2, Truck, Cloud, Code2, Leaf, TrendingUp, ArrowRight } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";

const CHAPTERS = [
  {
    id: "01",
    name: "São Paulo",
    icon: Building2,
    description: "The fintech heart of South America, specializing in digital banking and scalable payment infrastructure.",
  },
  {
    id: "02",
    name: "Mexico City",
    icon: Truck,
    description: "Scaling the future of logistics and supply chain tech in the region's largest industrial hub.",
  },
  {
    id: "03",
    name: "Bogotá",
    icon: Cloud,
    description: "Pioneering the next generation of cloud-native solutions for enterprise transformation.",
  },
  {
    id: "04",
    name: "Buenos Aires",
    icon: Code2,
    description: "Building the open-source movement in LATAM with full-stack engineering excellence.",
  },
  {
    id: "05",
    name: "Santiago",
    icon: Leaf,
    description: "Leading AI-driven climate tech initiatives and sustainable development strategies.",
  },
  {
    id: "06",
    name: "Lima",
    icon: TrendingUp,
    description: "Growth marketing specialists leveraging data science to scale regional startups.",
  },
];

export function ChaptersMap() {
  return (
    <section className="py-24 sm:py-32 bg-background relative overflow-hidden">
      <MainContainer>
        
        <div className="mb-20 text-center">
          <h2 className="fluid-h1 mb-6">
            A Continental Network
          </h2>
          <p className="fluid-body text-muted-foreground max-w-3xl mx-auto">
            Active student-led chapters in 18 innovation hubs across Latin America. Bridging the gap from local talent to global impact.
          </p>
        </div>

        {/* Interactive Map Visual */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-muted/10 rounded-[3rem] border border-border/20 mb-24 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
              <path d="M250,50 Q300,50 350,150 T450,250 T550,450" fill="none" stroke="currentColor" strokeDasharray="5,5" strokeWidth="1"></path>
              <path d="M200,100 Q400,100 600,300 T800,450" fill="none" stroke="currentColor" strokeDasharray="5,5" strokeWidth="1"></path>
            </svg>
          </div>
          {/* We omit the carbon fibre bg URL for a cleaner shadcn look, but keep the map dots */}
          <div className="map-dot" style={{ top: "45%", left: "35%" }} title="Mexico City"></div>
          <div className="map-dot" style={{ top: "70%", left: "45%" }} title="Bogotá"></div>
          <div className="map-dot" style={{ top: "80%", left: "65%" }} title="São Paulo"></div>
          <div className="map-dot" style={{ top: "85%", left: "55%" }} title="Santiago"></div>
          <div className="map-dot" style={{ top: "88%", left: "60%" }} title="Buenos Aires"></div>
          <div className="map-dot" style={{ top: "75%", left: "42%" }} title="Lima"></div>
          <div className="map-dot" style={{ top: "55%", left: "38%" }} title="Monterrey"></div>
          <div className="map-dot" style={{ top: "68%", left: "43%" }} title="Quito"></div>
          
          <div className="absolute bottom-8 left-10 bg-card/60 backdrop-blur-md px-6 py-3 rounded-full border border-border/30 text-xs font-mono flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]"></span>
            EXPLORE THE FRONTIER NETWORK
          </div>
        </div>

        {/* Redesigned Chapter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-12 lg:gap-16">
          {CHAPTERS.map((chapter) => {
            const ChapterIcon = chapter.icon;
            return (
              <div key={chapter.id} className="group p-10 rounded-[2.5rem] bg-card border border-border/20 hover:border-primary/40 hover:-translate-y-3 transition-all duration-500 chapter-card-glow flex flex-col items-start h-full">
                <div className="flex justify-between items-start w-full mb-8">
                  <span className="text-primary font-mono text-3xl font-bold tracking-tighter opacity-30 group-hover:opacity-100 transition-opacity">
                    {chapter.id}
                  </span>
                  <Icon icon={ChapterIcon} size="md" variant="accent" />
                </div>
                <h4 className="font-bold text-3xl mb-4 group-hover:text-primary transition-colors">{chapter.name}</h4>
                <p className="text-muted-foreground text-lg leading-relaxed flex-grow">{chapter.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Area */}
        <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-10 opacity-90">
          <div className="text-center md:text-left">
            <SectionLabel variant="primary" size="sm" className="mb-2">Expansion underway</SectionLabel>
            <p className="text-muted-foreground">Monterrey • Quito • Medellin • San Salvador • Panama City</p>
          </div>
          <Link 
            href="/chapters"
            className="bg-muted/40 border border-border/30 text-foreground font-bold px-10 py-5 rounded-full hover:bg-muted hover:text-primary transition-all flex items-center gap-3"
          >
            Explore All 18 Hubs <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </MainContainer>
    </section>
  );
}
