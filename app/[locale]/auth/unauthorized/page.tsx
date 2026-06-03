import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type UnauthorizedPageProps = {
  searchParams?: Promise<{
    next?: string
    reason?: string
  }>
}

function getSafeNextPath(next: string | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/student'
  }

  return next
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const params = await searchParams
  const next = getSafeNextPath(params?.next)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Acceso no disponible</CardTitle>
          <CardDescription>
            Tu sesion esta activa, pero esta cuenta no tiene permisos para abrir esta seccion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vuelve a tu espacio de trabajo o solicita acceso si necesitas operar esta vista.
          </p>
          <Button asChild>
            <Link href={next}>Ir a mi espacio</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
