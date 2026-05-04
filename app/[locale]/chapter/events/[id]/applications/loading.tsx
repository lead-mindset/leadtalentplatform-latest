export default function Loading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
            <div className="space-y-2">
              <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
              <div className="h-5 w-80 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
              <div className="mt-3 h-8 w-14 animate-pulse rounded-md bg-muted" />
              <div className="mt-1 h-3 w-28 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted lg:w-96" />
          <div className="h-14 w-full animate-pulse rounded-lg bg-muted lg:w-[34rem]" />
        </div>

        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="grid gap-4 rounded-lg border bg-card p-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_auto]">
              <div className="space-y-3">
                <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
                <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
              </div>
              <div className="flex gap-2 lg:flex-col">
                <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
