import { MainContainer } from '@/components/global/main-container'

export default function Loading() {
  return (
    <MainContainer className="py-8 space-y-8">
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-72 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
              <div className="mt-1 h-3 w-28 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid gap-4 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_8rem_10rem_8rem_15rem]">
            <div className="space-y-2">
              <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </MainContainer>
  )
}
