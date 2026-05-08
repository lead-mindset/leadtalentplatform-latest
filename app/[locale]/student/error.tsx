'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

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
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icons.AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Algo salio mal</h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Ocurrio un error al cargar esta pagina. Intenta nuevamente.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => reset()} size="lg">
            Intentar de nuevo
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/student/profile">Ir a mi perfil</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
