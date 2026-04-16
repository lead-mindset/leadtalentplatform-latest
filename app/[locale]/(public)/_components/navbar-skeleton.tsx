export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md ring-1 ring-foreground/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo skeleton */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-11 h-11 bg-muted rounded-lg animate-pulse"></div>
            <div className="space-y-1">
              <div className="bg-muted h-5 w-12 rounded animate-pulse"></div>
              <div className="bg-muted h-2 w-20 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Nav links skeleton */}
          <nav className="hidden md:flex px-2 items-center flex-1 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-8 w-16 rounded-full animate-pulse"></div>
            ))}
          </nav>

          {/* User buttons skeleton */}
          <div className="hidden md:flex items-center gap-2">
            <div className="bg-muted h-9 w-20 rounded-md animate-pulse"></div>
            <div className="bg-muted h-9 w-16 rounded-md animate-pulse"></div>
            <div className="bg-muted h-9 w-20 rounded-md animate-pulse"></div>
          </div>

          {/* Mobile menu button skeleton */}
          <div className="md:hidden w-10 h-10 bg-muted rounded-full animate-pulse"></div>
        </div>
      </div>
    </header>
  );
}
