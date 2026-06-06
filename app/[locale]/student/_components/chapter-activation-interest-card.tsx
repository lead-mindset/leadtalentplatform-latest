'use client'

import { FormEvent, useState, useTransition } from 'react'
import { CheckCircle2, ClipboardList, Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/routing'
import { submitChapterActivationInterest } from '@/lib/actions/student/chapter-activation-interest'
import type { ChapterActivationInterestRow } from '@/lib/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  motivation: 'Explica el origen de tu interés en una o dos ideas concretas.',
  universityContext: 'Incluye carrera, campus, comunidad estudiantil o contexto relevante.',
  leadValue: 'Describe el problema o necesidad que LEAD podría ayudar a organizar.',
  teamStatus: 'Aclara si estás explorando solo/a o con otras personas.',
  opportunities: 'Menciona necesidades, actividades o espacios que ya existen en tu universidad.',
  commitment: 'Indica tu disponibilidad real para coordinar y dar seguimiento.',
}

function FieldHelp({ children }: { children: string }) {
  return <p className="text-xs leading-4 text-muted-foreground">{children}</p>
}

function SubmittedState({ interest }: { interest: NonNullable<ChapterActivationInterestCardProps['latestInterest']> }) {
  return (
    <Alert className="rounded-lg border-success/30 bg-success/5">
      <CheckCircle2 className="h-4 w-4 text-success" />
      <AlertTitle>Interés registrado para {interest.university_name}</AlertTitle>
      <AlertDescription className="leading-6">
        El equipo revisará el contexto y definirá si corresponde una orientación inicial o una
        conversación de activación.
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          Interés para activar LEAD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Completa este formulario si quieres explorar una posible activación en tu universidad.
            Esto no crea membresía, rol de capítulo ni aprobación automática.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Qué revisamos
              </p>
              <p className="mt-1">
                Contexto de la universidad, claridad del problema, personas interesadas y capacidad
                de seguimiento.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <ClipboardList className="h-4 w-4 text-primary" />
                Siguiente paso
              </p>
              <p className="mt-1">
                Si hay base suficiente, el equipo puede agendar una conversación. Si falta contexto,
                puede pedir información adicional.
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
              <Label htmlFor="activation-motivation">¿Por qué quieres explorar una activación?</Label>
              <Textarea id="activation-motivation" name="motivation" required rows={3} />
              <FieldHelp>{FIELD_HELPERS.motivation}</FieldHelp>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-context">
                ¿Cuál es tu universidad y contexto actual?
              </Label>
              <Textarea id="activation-context" name="university_context" required rows={3} />
              <FieldHelp>{FIELD_HELPERS.universityContext}</FieldHelp>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-value">
                ¿Qué necesidad concreta ves en tu comunidad?
              </Label>
              <Textarea id="activation-value" name="lead_value" required rows={3} />
              <FieldHelp>{FIELD_HELPERS.leadValue}</FieldHelp>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-team">
                ¿Estás explorando solo/a o con un grupo inicial?
              </Label>
              <Textarea id="activation-team" name="team_status" required rows={3} />
              <FieldHelp>{FIELD_HELPERS.teamStatus}</FieldHelp>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-people">
                ¿A quiénes podrías sumar a una primera conversación?
              </Label>
              <Textarea id="activation-people" name="interested_people_context" required rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-opportunities">
                ¿Qué oportunidades o problemas ya identificaste?
              </Label>
              <Textarea id="activation-opportunities" name="opportunities" required rows={3} />
              <FieldHelp>{FIELD_HELPERS.opportunities}</FieldHelp>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-commitment">
                ¿Qué nivel de seguimiento puedes asumir?
              </Label>
              <Textarea id="activation-commitment" name="long_term_commitment" required rows={3} />
              <FieldHelp>{FIELD_HELPERS.commitment}</FieldHelp>
            </div>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">
              Después de enviar, el equipo revisará la información y responderá con el siguiente
              paso. Esta solicitud no cambia tu membresía ni tus permisos.
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
