export function HeroSkeleton() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6">
          {/* Title skeleton */}
          <div className="space-y-4">
            <div className="bg-muted h-12 w-3/4 mx-auto rounded-lg animate-pulse"></div>
            <div className="bg-muted h-8 w-1/2 mx-auto rounded-lg animate-pulse"></div>
          </div>
          
          {/* CTA buttons skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-muted h-12 w-32 rounded-lg animate-pulse"></div>
            <div className="bg-muted h-12 w-32 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Background decoration skeleton */}
      <div className="absolute inset-0 -z-10">
        <div className="bg-muted/20 absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-pulse"></div>
        <div className="bg-muted/20 absolute bottom-20 right-10 w-40 h-40 rounded-full blur-xl animate-pulse"></div>
      </div>
    </section>
  );
}
