'use client'

import { FormEvent, useState, useTransition } from 'react'
import { CheckCircle2, Send, Sparkles } from 'lucide-react'
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

function SubmittedState({ interest }: { interest: NonNullable<ChapterActivationInterestCardProps['latestInterest']> }) {
  return (
    <Alert className="rounded-lg border-success/30 bg-success/5">
      <CheckCircle2 className="h-4 w-4 text-success" />
      <AlertTitle>Interés registrado para {interest.university_name}</AlertTitle>
      <AlertDescription className="leading-6">
        El equipo revisará tu contexto y te contactará para definir los siguientes pasos.
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
          <Sparkles className="h-5 w-5 text-primary" />
          Activar LEAD en mi universidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          ¿Tu universidad aún no tiene capítulo LEAD? Cuéntanos tu interés para que el equipo evalúe
          si hay base para una activación. Esto no crea membresía ni aprobación automática.
        </p>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="activation-context">País y ciudad</Label>
                <Input
                  id="activation-context"
                  name="interested_people_context"
                  placeholder="Ej. Perú, Lima"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activation-team">¿Vas solo o con equipo?</Label>
                <Textarea id="activation-team" name="team_status" required rows={2} placeholder="Ej. Estoy explorando solo / Somos un grupo de 3" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-motivation">¿Por qué quieres traer LEAD a tu universidad?</Label>
              <Textarea id="activation-motivation" name="motivation" required rows={3} placeholder="Ej. Hay talento técnico pero falta liderazgo en el ecosistema..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="activation-value">¿Qué impacto crearía un capítulo?</Label>
                <Textarea id="activation-value" name="lead_value" required rows={3} placeholder="Ej. Conectaría a estudiantes con proyectos reales..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activation-opportunities">¿Qué oportunidades o espacios ya existen?</Label>
                <Textarea id="activation-opportunities" name="opportunities" required rows={3} placeholder="Ej. Hay hackathons, grupos de estudio, laboratorios..." />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="activation-uni-context">Cuéntanos de tu universidad</Label>
                <Textarea id="activation-uni-context" name="university_context" required rows={3} placeholder="Ej. Carrera, campus, tamaño de la comunidad estudiantil..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activation-commitment">¿Cuánto tiempo puedes dedicar?</Label>
                <Textarea id="activation-commitment" name="long_term_commitment" required rows={3} placeholder="Ej. Unas 5h/semana. Ya tengo un grupo organizado." />
              </div>
            </div>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

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
