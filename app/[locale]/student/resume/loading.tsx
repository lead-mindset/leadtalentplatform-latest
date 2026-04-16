export default function Loading() {
  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      
      {/* Resume Form Skeleton */}
      <div className="w-full max-w-2xl mx-auto space-y-5">
        <div className="overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-card/50 to-card/30 shadow-sm backdrop-blur-sm">
          <div className="pb-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 animate-pulse">
              </div>
              <div className="space-y-1">
                <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-full animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>
        
        {/* Upload Section Skeleton */}
        <div className="rounded-lg border border-dashed border-border/60 p-8 text-center space-y-4">
          <div className="h-12 w-12 animate-pulse rounded-md bg-muted mx-auto" />
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted mx-auto" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted mx-auto" />
          <div className="h-10 w-40 animate-pulse rounded-md bg-muted mx-auto" />
        </div>
      </div>
    </div>
  )
}
