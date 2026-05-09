import ResumeClient from './components/resume-form'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import { getCurrentUserResume } from '@/lib/actions/student/profile'
import Link from 'next/link'
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
        description="Manten actualizado tu CV para futuras oportunidades con empresas aliadas. Solo se comparte cuando tu perfil profesional esta habilitado."
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icons.Crown className="h-4 w-4 text-primary" />
                </span>
                Consejos rapidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Empieza tus logros con verbos de accion.',
                  'Usa un formato claro y facil de escanear.',
                  'Cuantifica impacto con metricas cuando sea posible.',
                  'Ajusta habilidades y proyectos a la oportunidad.',
                ].map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
                  <Icons.BookOpen className="h-4 w-4 text-info" />
                </span>
                Recursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'Plantilla de CV', icon: 'FileText' as const },
                  { label: 'Guia de verbos de accion', icon: 'BookOpen' as const },
                ].map(({ label, icon }) => {
                  const IconComponent = Icons[icon]
                  return (
                    <Link
                      key={label}
                      href="#"
                      className="group flex items-center justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/60"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
                      </span>
                      <Icons.ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    </Link>
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
