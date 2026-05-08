'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MainContainer } from '@/components/global/main-container'
import { Link } from '@/i18n/routing'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <MainContainer maxWidth="3xl" className="py-10">
      <Card className="rounded-lg">
        <CardContent className="space-y-5 py-8 text-center">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">No pudimos cargar tus eventos</h2>
            <p className="text-sm text-muted-foreground">
              Actualiza la pagina o explora eventos publicos mientras lo intentamos otra vez.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={reset}>Reintentar</Button>
            <Button asChild variant="outline">
              <Link href="/events">Explorar eventos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainContainer>
  )
}
