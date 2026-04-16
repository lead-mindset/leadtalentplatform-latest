import { NavbarSkeleton } from "./_components/navbar-skeleton";
import { HeroSkeleton } from "./_components/hero-skeleton";
import { FooterSkeleton } from "./_components/footer-skeleton";

export default function PublicLoading() {
  return (
    <div className="min-h-screen flex flex-col text-foreground antialiased relative overflow-hidden">
      <div className="relative z-10">
        <NavbarSkeleton />
        <main className="flex-1">
          <HeroSkeleton />
          <div className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-muted h-4 rounded w-3/4"></div>
                      <div className="bg-muted h-4 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <FooterSkeleton />
      </div>
    </div>
  );
}
