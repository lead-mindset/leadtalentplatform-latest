function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
}

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-5 w-full max-w-xl" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-24" />
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-32 border bg-card" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <SkeletonBlock className="h-80 border bg-card" />
        <SkeletonBlock className="h-80 border bg-card" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SkeletonBlock className="h-96 border bg-card xl:col-span-2" />
        <SkeletonBlock className="h-96 border bg-card" />
      </div>
    </div>
  )
}
