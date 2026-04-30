'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'

export default function ChapterError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Chapter page error:', error)
  }, [error])

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Icons.AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle>Something went wrong</CardTitle>
                <CardDescription>
                  An error occurred while loading the chapter dashboard.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Unknown error'}
            </p>
            <div className="flex gap-2">
              <Button onClick={reset}>
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/student'} variant="outline">
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}