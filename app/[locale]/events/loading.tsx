export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <section className="space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
              <div className="space-y-3">
                <div className="h-10 w-72 animate-pulse rounded-lg bg-muted md:h-14 md:w-[28rem]" />
                <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="h-20 w-full animate-pulse rounded-lg border bg-card sm:w-28" />
              <div className="h-20 w-full animate-pulse rounded-lg border bg-card sm:w-28" />
            </div>
          </div>
          <div className="h-12 animate-pulse rounded-lg border bg-card" />
        </section>

        <section className="space-y-4">
          <div className="space-y-2 border-b pb-3">
            <div className="h-7 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-80 animate-pulse rounded bg-muted" />
          </div>

          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border bg-card">
                <div className="grid md:grid-cols-[11rem_1fr]">
                  <div className="h-28 animate-pulse border-b bg-muted/50 md:h-auto md:border-b-0 md:border-r" />
                  <div className="space-y-5 p-5 md:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
                        </div>
                        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                      <div className="h-4 animate-pulse rounded bg-muted" />
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
