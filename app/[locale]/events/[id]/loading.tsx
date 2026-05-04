export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="space-y-3">
                <div className="h-12 w-full max-w-3xl animate-pulse rounded-lg bg-muted md:h-16" />
                <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-muted" />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="grid md:grid-cols-[18rem_1fr]">
                <div className="h-64 animate-pulse bg-muted md:h-auto" />
                <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-5 w-36 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-7 w-40 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          <aside className="rounded-lg border bg-card p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-28 animate-pulse rounded bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-20 animate-pulse rounded-lg bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
