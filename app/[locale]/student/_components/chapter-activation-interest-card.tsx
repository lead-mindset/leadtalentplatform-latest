'use client'

import { FormEvent, useState, useTransition } from 'react'
import { CheckCircle2, MessageSquareText, Send, Sparkles, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/routing'
import { submitChapterActivationInterest } from '@/lib/actions/student/chapter-activation-interest'
import type { ChapterActivationInterestRow } from '@/lib/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ChapterActivationInterestCardProps = {
  latestInterest: Pick<
    ChapterActivationInterestRow,
    'id' | 'status' | 'university_name' | 'created_at'
  > | null
}

const FIELD_HELPERS = {
  motivation: 'No buscamos una respuesta perfecta; queremos entender qué te acercó a LEAD.',
  universityContext: 'Cuéntanos carrera, campus, comunidad estudiantil o cualquier contexto relevante.',
  leadValue: 'Usa ejemplos concretos: eventos, mentorías, red, oportunidades o problemas que LEAD podría ayudar a mover.',
  teamStatus: 'Puede ser que estés explorando solo/a o que ya tengas personas interesadas.',
  opportunities: 'Piensa en actividades, necesidades, problemas u oportunidades visibles en tu universidad.',
  commitment: 'Sé honesto/a sobre tiempo semanal, construcción de equipo y seguimiento a largo plazo.',
}

function SubmittedState({ interest }: { interest: NonNullable<ChapterActivationInterestCardProps['latestInterest']> }) {
  return (
    <Alert className="rounded-lg border-success/30 bg-success/5">
      <CheckCircle2 className="h-4 w-4 text-success" />
      <AlertTitle>Ya recibimos tu interés por {interest.university_name}</AlertTitle>
      <AlertDescription className="leading-6">
        El equipo de LEAD revisará tu contexto, se pondrá en contacto contigo y te acompañará en
        el siguiente paso. Puede ser una orientación inicial o una conversación para evaluar si la
        activación ya está lista para avanzar.
      </AlertDescription>
    </Alert>
  )
}

export function ChapterActivationInterestCard({
  latestInterest,
}: ChapterActivationInterestCardProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await submitChapterActivationInterest(formData)

      if (!result.success) {
        const message = result.error ?? 'No se pudo enviar el interés de activación.'
        setError(message)
        toast.error(message)
        return
      }

      toast.success('Tu interés fue enviado. LEAD revisará tu contexto.')
      router.refresh()
    })
  }

  return (
    <Card className="rounded-lg">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" size="sm">Primera conversación</Badge>
          <Badge variant="secondary" size="sm">No es una aplicación competitiva</Badge>
        </div>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Traer LEAD a mi universidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            LEAD es una comunidad estudiantil que ayuda a organizar eventos, mentorías y
            oportunidades para crecer profesionalmente y construir una red con otros estudiantes y
            aliados.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Qué implica
              </p>
              <p className="mt-1">
                Liderazgo activo, construir equipo, dedicar tiempo semanal y dar seguimiento
                continuo. No necesitas tener todo resuelto para empezar la conversación.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <MessageSquareText className="h-4 w-4 text-primary" />
                Qué buscamos
              </p>
              <p className="mt-1">
                Iniciativa, disposición para aprender y compromiso. La experiencia previa liderando
                organizaciones ayuda, pero no es requisito.
              </p>
            </div>
          </div>
        </div>

        {latestInterest?.status === 'submitted' ? (
          <SubmittedState interest={latestInterest} />
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="activation-university">Universidad</Label>
              <Input
                id="activation-university"
                name="university_name"
                placeholder="Ej. Universidad Nacional de Ingeniería"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-motivation">¿Qué te motivó a acercarte a LEAD?</Label>
              <Textarea id="activation-motivation" name="motivation" required rows={3} />
              <p className="text-xs leading-5 text-muted-foreground">{FIELD_HELPERS.motivation}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-context">
                ¿En qué universidad estudias y cómo describirías tu contexto?
              </Label>
              <Textarea id="activation-context" name="university_context" required rows={3} />
              <p className="text-xs leading-5 text-muted-foreground">{FIELD_HELPERS.universityContext}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-value">
                ¿Por qué crees que LEAD podría aportar valor en tu comunidad universitaria?
              </Label>
              <Textarea id="activation-value" name="lead_value" required rows={3} />
              <p className="text-xs leading-5 text-muted-foreground">{FIELD_HELPERS.leadValue}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-team">
                ¿Ya conoces a otras personas interesadas o estás explorando individualmente?
              </Label>
              <Textarea id="activation-team" name="team_status" required rows={3} />
              <p className="text-xs leading-5 text-muted-foreground">{FIELD_HELPERS.teamStatus}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-people">
                ¿Qué perfiles o personas te gustaría sumar al equipo inicial?
              </Label>
              <Textarea id="activation-people" name="interested_people_context" required rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-opportunities">
                ¿Qué actividades, problemas u oportunidades identificas en tu universidad?
              </Label>
              <Textarea id="activation-opportunities" name="opportunities" required rows={3} />
              <p className="text-xs leading-5 text-muted-foreground">{FIELD_HELPERS.opportunities}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-commitment">
                ¿Qué tan dispuesto/a estás a asumir liderazgo y construcción a largo plazo?
              </Label>
              <Textarea id="activation-commitment" name="long_term_commitment" required rows={3} />
              <p className="text-xs leading-5 text-muted-foreground">{FIELD_HELPERS.commitment}</p>
            </div>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">
              Después de enviar, LEAD revisará tu contexto, te contactará y definirá contigo si el
              siguiente paso es orientación inicial o avanzar hacia una activación.
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar interés'}
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
