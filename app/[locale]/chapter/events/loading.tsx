export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>
        
        {/* Quick Stats Bar Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 border border-border/60">
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded-md bg-muted mt-1" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Events Table Skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded-md bg-muted" />
                  <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
                  {i % 2 === 0 && (
                    <div className="flex items-center gap-1 animate-pulse">
                      <div className="h-4 w-4 animate-pulse rounded-md bg-muted" />
                    </div>
                  )}
                  {i % 2 === 1 && (
                    <div className="flex items-center gap-1 animate-pulse">
                      <div className="h-4 w-4 animate-pulse rounded-md bg-muted" />
                    </div>
                  )}
                </div>
                <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-2 w-full animate-pulse rounded-md bg-muted" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
