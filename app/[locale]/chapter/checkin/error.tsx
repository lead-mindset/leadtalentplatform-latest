'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardContent className="space-y-5 py-10 text-center">
          <div>
            <h2 className="text-xl font-semibold">Unable to load check-in</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Retry the operator console, or return to chapter events and open check-in again.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={reset}>
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link href="/chapter/events">Chapter events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
