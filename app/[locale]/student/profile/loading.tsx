export default function Loading() {
  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      
      {/* Member ID Section Skeleton */}
      <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 mb-12">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-4 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted mt-2" />
      </div>
      
      {/* Form Sections Skeleton */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse">
            </div>
            <div className="space-y-1">
              <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>
        
        {/* Form Grid Skeleton */}
        <div className="grid gap-5 rounded-xl border border-border/60 bg-card/30 p-6 shadow-sm backdrop-blur-sm">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        
        {/* Submit Button Skeleton */}
        <div className="flex justify-end">
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}
