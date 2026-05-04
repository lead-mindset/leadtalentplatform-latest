import { MainContainer } from '@/components/global/main-container'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export default function Loading() {
  return (
    <MainContainer maxWidth="7xl" className="space-y-8 py-6 pb-24 sm:py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-32" />
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-8 w-72 max-w-full" />
                  <Skeleton className="h-5 w-56 max-w-full" />
                </div>
                <Skeleton className="h-7 w-28" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="space-y-4">
                <Skeleton className="h-5 w-72 max-w-full" />
                <Skeleton className="h-5 w-64 max-w-full" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </div>
              <Skeleton className="aspect-square w-full max-w-[18rem]" />
            </CardContent>
          </Card>

          <div className="flex gap-2 overflow-hidden">
            <Skeleton className="h-10 w-24 shrink-0" />
            <Skeleton className="h-10 w-32 shrink-0" />
            <Skeleton className="h-10 w-24 shrink-0" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((item) => (
              <Card key={item} className="rounded-lg">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-6 w-64 max-w-full" />
                  <Skeleton className="h-5 w-52 max-w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <aside>
          <Card className="rounded-lg">
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </CardContent>
          </Card>
        </aside>
      </div>
    </MainContainer>
  )
}
