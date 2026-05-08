'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">No se cargaron los datos de administracion</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Intenta recargar la vista o vuelve al resumen para elegir otra seccion de gestion.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => reset()}>Reintentar</Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Resumen de administracion</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
