'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MainContainer } from '@/components/global/main-container'
import { Link } from '@/i18n/routing'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <MainContainer maxWidth="3xl" className="py-10">
      <Card className="rounded-lg">
        <CardContent className="space-y-5 py-8 text-center">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Unable to load your events</h2>
            <p className="text-sm text-muted-foreground">
              Refresh the page or browse public events while we try again.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={reset}>Retry</Button>
            <Button asChild variant="outline">
              <Link href="/events">Browse events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainContainer>
  )
}
