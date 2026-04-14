'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Student page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-md">
          We encountered an error while loading this page. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/student/profile">Go to Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
