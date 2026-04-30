export function FooterSkeleton() {
  return (
    <footer className="bg-muted/30 border-t border-foreground/8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="bg-muted h-8 w-16 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="bg-muted h-4 w-24 rounded animate-pulse"></div>
              <div className="bg-muted h-4 w-20 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Footer sections */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="bg-muted h-6 w-20 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="bg-muted h-4 w-16 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-foreground/8 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="bg-muted h-4 w-32 rounded animate-pulse"></div>
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted h-5 w-5 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
