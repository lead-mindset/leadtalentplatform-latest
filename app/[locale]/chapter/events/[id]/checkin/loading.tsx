export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <div className="h-4 w-52 animate-pulse rounded bg-muted" />
        <div className="h-9 w-64 animate-pulse rounded bg-muted" />
        <div className="h-5 w-full max-w-lg animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-lg border bg-card" />
        <div className="h-28 animate-pulse rounded-lg border bg-card" />
        <div className="h-28 animate-pulse rounded-lg border bg-card" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-[34rem] animate-pulse rounded-lg border bg-card" />
        <div className="space-y-3">
          <div className="h-44 animate-pulse rounded-lg border bg-card" />
          <div className="h-40 animate-pulse rounded-lg border bg-card" />
        </div>
      </div>
    </div>
  )
}
