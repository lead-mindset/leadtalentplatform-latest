export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
            <div className="space-y-1">
              <div className="h-5 w-12 animate-pulse rounded bg-muted" />
              <div className="h-2 w-20 animate-pulse rounded-md bg-muted" />
            </div>
          </div>

          <nav className="hidden flex-1 items-center gap-1 px-2 md:flex">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          </div>

          <div className="h-8 w-8 animate-pulse rounded-md bg-muted md:hidden" />
        </div>
      </div>
    </header>
  );
}
