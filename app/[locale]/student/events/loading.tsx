export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
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
      
      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
        
        {/* Event Cards Skeleton */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 p-4 space-y-3">
              <div className="flex justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-20 w-full animate-pulse rounded-md bg-muted" />
              <div className="flex gap-2">
                <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
