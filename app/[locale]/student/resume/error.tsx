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
        <h2 className="text-lg font-semibold">No se pudo cargar tu CV</h2>
        <p className="text-sm text-muted-foreground">
          Actualiza la página o intenta nuevamente.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Reintentar
      </Button>
    </div>
  )
}
