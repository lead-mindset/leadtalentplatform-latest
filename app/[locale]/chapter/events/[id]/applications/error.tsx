'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Icons.AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">No se pudieron cargar las postulaciones</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Actualiza esta cola de revisión o vuelve a eventos del capítulo.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={reset}>Reintentar</Button>
            <Button asChild variant="outline">
              <Link href="/chapter/events">Eventos del capítulo</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
