import { BookOpenCheck } from 'lucide-react'
import { MainContainer } from '@/components/global/main-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { submitGrowthReflection } from '@/lib/actions/student/growth-reflection'
import { requireUser } from '@/lib/auth'

function TextAreaField({
  name,
  label,
  placeholder,
}: {
  name: string
  label: string
  placeholder: string
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <textarea
        required
        name={name}
        placeholder={placeholder}
        className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  )
}

export default async function GrowthReflectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    eventId?: string
    eventTitle?: string
    recommendationId?: string
    recommendationTitle?: string
  }>
}) {
  await requireUser()
  const params = await searchParams
  const eventTitle = params.eventTitle ? decodeURIComponent(params.eventTitle) : ''
  const recommendationTitle = params.recommendationTitle
    ? decodeURIComponent(params.recommendationTitle)
    : ''
  const participatedInDefault = eventTitle || recommendationTitle

  return (
    <MainContainer maxWidth="3xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        eyebrow="Mi LEAD"
        title="Reflexión de crecimiento"
        description="Convierte una experiencia en prueba privada de crecimiento. Luego podrás decidir si la transformas en otra cosa."
        badge={
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium text-muted-foreground">
            <BookOpenCheck className="h-4 w-4" />
            Privado por defecto
          </div>
        }
      />

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Tu reflexión</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitGrowthReflection} className="space-y-5">
            {params.eventId ? <input type="hidden" name="event_id" value={params.eventId} /> : null}
            {params.recommendationId ? (
              <input type="hidden" name="recommendation_id" value={params.recommendationId} />
            ) : null}
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-foreground">
                ¿Qué experiencia de LEAD quieres capturar?
              </span>
              <input
                required
                name="participated_in"
                defaultValue={participatedInDefault}
                placeholder="Ej. IBM Explore Day, una mentoría, un taller de IA..."
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <TextAreaField
              name="learned"
              label="¿Qué aprendiste?"
              placeholder="Escribe una idea, habilidad o decisión que ahora entiendes mejor."
            />
            <TextAreaField
              name="skill_or_mindset"
              label="¿Qué skill o mindset practicaste?"
              placeholder="Ej. comunicación, curiosidad, liderazgo, pensamiento técnico..."
            />
            <TextAreaField
              name="goal_connection"
              label="¿Cómo conecta esto con tus metas?"
              placeholder="Conecta la experiencia con el camino que quieres construir."
            />
            <TextAreaField
              name="next_move"
              label="¿Cuál es tu siguiente movimiento?"
              placeholder="Una acción pequeña y concreta para seguir avanzando."
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" name="status" value="completed" className="w-full sm:w-auto">
                Guardar reflexión
              </Button>
              <Button
                type="submit"
                name="status"
                value="draft"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Guardar borrador
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </MainContainer>
  )
}
