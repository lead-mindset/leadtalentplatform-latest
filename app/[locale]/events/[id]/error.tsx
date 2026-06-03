'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No se pudo cargar este evento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Actualiza la pagina o intenta nuevamente en un momento.
            </p>
          </div>
          <Button onClick={reset} variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
