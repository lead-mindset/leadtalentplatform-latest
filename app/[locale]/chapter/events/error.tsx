'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MainContainer } from '@/components/global/main-container'
import { Icons } from '@/components/ui/icons'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <MainContainer className="py-8">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Icons.AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Unable to load chapter events</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Refresh the page or return to the chapter overview while we reload this workspace.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={reset}>Retry</Button>
            <Button asChild variant="outline">
              <Link href="/chapter">Chapter overview</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainContainer>
  )
}
