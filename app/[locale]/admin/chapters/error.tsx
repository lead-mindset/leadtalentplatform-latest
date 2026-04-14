'use client'

import { Button } from '@/components/ui/button'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Unable to load chapters</h2>
        <p className="text-sm text-muted-foreground">
          Refresh the page or try again.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Retry
      </Button>
    </div>
  )
}
