import ResumeClient from './components/resume-form'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import { getCurrentUserResume } from '@/lib/actions/student/profile'
import { Icons } from '@/components/ui/icons'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function StudentResumePage() {
  const resume = await getCurrentUserResume()

  return (
    <MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        eyebrow="Mi LEAD"
        title="Mi CV"
        description="Sube un PDF actualizado para mantener tu perfil listo. LEAD solo lo usa en oportunidades autorizadas por tu configuración profesional."
        badge={
          resume ? (
            <Badge variant="success" size="lg">
              CV activo
            </Badge>
          ) : (
            <Badge variant="warning" size="lg">
              Pendiente
            </Badge>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
        <div className="min-w-0 xl:col-span-8">
          <ResumeClient resume={resume} onUpload={uploadResume} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:col-span-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icons.FileText className="h-5 w-5 text-primary" />
                Revisión rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Empieza tus logros con verbos de acción.',
                  'Usa un formato claro y fácil de escanear.',
                  'Cuantifica impacto con métricas cuando sea posible.',
                  'Ajusta habilidades y proyectos a la oportunidad.',
                ].map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm leading-6 text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icons.BookOpen className="h-5 w-5 text-info" />
                Recursos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Estos recursos se agregarán pronto. Por ahora, enfócate en subir un PDF claro y actualizado.
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Plantilla de CV', icon: 'FileText' as const },
                  { label: 'Guía de verbos de acción', icon: 'BookOpen' as const },
                ].map(({ label, icon }) => {
                  const IconComponent = Icons[icon]
                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 p-3"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
                      </span>
                      <Badge variant="outline">Pronto</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </MainContainer>
  )
}
