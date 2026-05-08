import { getCompanyStats, getSavedStudents } from '@/lib/actions/company/get-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Users, Heart, Building } from 'lucide-react'
import Link from 'next/link'
import { requireRecruiter } from '@/lib/auth'

export default async function CompanyDashboardPage() {
  const { supabase, user } = await requireRecruiter()

  const [stats, recentSaved] = await Promise.all([
    getCompanyStats(supabase, user.id),
    getSavedStudents(supabase, user.id),
  ])

  const recentlySaved = recentSaved.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portal de empresa"
        title="Resumen de representante"
        description={`Bienvenido de nuevo${user.name ? `, ${user.name}` : ''}. Revisa talento LEAD visible, perfiles guardados y acceso de empresa desde un solo lugar.`}
        actions={
          <>
            <Button asChild>
              <Link href="/company/browse">Explorar talento</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/company/saved">Talento guardado</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talento disponible</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_students}</div>
            <p className="text-xs text-muted-foreground">Disponible para revisar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talento guardado</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.saved_students}</div>
            <p className="text-xs text-muted-foreground">En tu lista</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresa</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{user.company?.name}</div>
            <p className="text-xs text-muted-foreground">Tu organizacion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones rapidas</CardTitle>
            <CardDescription>Tareas frecuentes para representantes de empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/company/browse">
                <Users className="mr-2 h-4 w-4" />
                Explorar talento
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/company/saved">
                <Heart className="mr-2 h-4 w-4" />
                Ver talento guardado
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardados recientemente</CardTitle>
            <CardDescription>Perfiles que guardaste hace poco</CardDescription>
          </CardHeader>
          <CardContent>
            {recentlySaved.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Todavia no hay talento guardado</p>
                <Button asChild variant="link" size="sm" className="mt-2">
                  <Link href="/company/browse">Empezar a explorar</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentlySaved.map((saved) => (
                  <div key={saved.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{saved.student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {saved.student.person_profile?.major_or_interest || 'Area no registrada'}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/company/students/${saved.student_id}`}>Ver</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
