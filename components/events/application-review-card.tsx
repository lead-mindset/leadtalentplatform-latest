'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ApplicationReviewCardProps {
  application: {
    id: string
    userId: string
    registeredAt: string
    status: 'pending_review' | 'registered' | 'rejected'
    User: {
      name: string
      email: string
    }
    ApplicantProfile: {
      majorOrInterest: string
      graduation_year: number
      linkedinUrl?: string | null
      portfolioUrl?: string | null
    }
    applicationAnswers?: Array<{
      id: string
      answer_text: string | null
      answer_json: unknown
      event_application_question: {
        question_text: string
        question_type: string
      } | null
    }>
  }
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, internalNote?: string) => Promise<void>
  isProcessing?: boolean
  showCheckbox?: boolean
}

function answerValue(answer: NonNullable<ApplicationReviewCardProps['application']['applicationAnswers']>[number]) {
  if (Array.isArray(answer.answer_json)) {
    return answer.answer_json.join(', ')
  }

  if (answer.answer_json && typeof answer.answer_json === 'object') {
    return JSON.stringify(answer.answer_json)
  }

  return answer.answer_text || 'Sin respuesta'
}

function statusConfig(status: ApplicationReviewCardProps['application']['status']) {
  if (status === 'registered') {
    return { label: 'Aprobada', variant: 'success' as const }
  }

  if (status === 'rejected') {
    return { label: 'Rechazada', variant: 'destructive' as const }
  }

  return { label: 'Pendiente de revisión', variant: 'warning' as const }
}

export function ApplicationReviewCard({
  application,
  isSelected = false,
  onSelect,
  onApprove,
  onReject,
  isProcessing = false,
  showCheckbox = false,
}: ApplicationReviewCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [isActionPending, setIsActionPending] = useState(false)

  const handleApprove = async () => {
    setIsActionPending(true)
    try {
      await onApprove(application.id)
    } finally {
      setIsActionPending(false)
    }
  }

  const handleReject = async () => {
    setIsActionPending(true)
    try {
      await onReject(application.id, rejectNote)
      setShowRejectDialog(false)
      setRejectNote('')
    } finally {
      setIsActionPending(false)
    }
  }

  const isPending = application.status === 'pending_review'
  const status = statusConfig(application.status)
  const applicationAnswers = application.applicationAnswers ?? []

  return (
    <>
      <article
        className={cn(
          'rounded-lg border bg-card p-4 transition-colors',
          isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/40',
          !isPending && 'bg-card/70'
        )}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_auto]">
          <div className="flex min-w-0 gap-3">
            {showCheckbox && isPending ? (
              <Checkbox
                className="mt-1"
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(application.id, checked as boolean)}
                disabled={isProcessing}
                aria-label={`Seleccionar ${application.User.name}`}
              />
            ) : null}

            <div className="min-w-0 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icons.User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{application.User.name}</h3>
                  <p className="mt-0.5 break-all text-sm text-muted-foreground">
                    {application.User.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">
                  Postulo el {new Date(application.registeredAt).toLocaleDateString('es-PE', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Badge>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Icons.GraduationCap className="h-4 w-4 shrink-0" />
                  <span className="truncate">{application.ApplicantProfile.majorOrInterest}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icons.Calendar className="h-4 w-4 shrink-0" />
                  <span>Graduacion {application.ApplicantProfile.graduation_year || 'no registrada'}</span>
                </div>
                {application.ApplicantProfile.linkedinUrl ? (
                  <a
                    href={application.ApplicantProfile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-sm text-primary underline underline-offset-4"
                  >
                    <span className="truncate">LinkedIn profile</span>
                    <Icons.ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ) : null}
                {application.ApplicantProfile.portfolioUrl ? (
                  <a
                    href={application.ApplicantProfile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-sm text-primary underline underline-offset-4"
                  >
                    <span className="truncate">Portafolio</span>
                    <Icons.ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold">Respuestas de postulación</h4>
              <Badge variant="neutral" size="sm">
                {applicationAnswers.length} respuesta{applicationAnswers.length === 1 ? '' : 's'}
              </Badge>
            </div>

            {applicationAnswers.length > 0 ? (
              <div className="grid gap-3">
                {applicationAnswers.map((answer) => (
                  <div key={answer.id} className="rounded-lg border bg-background p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {answer.event_application_question?.question_text ?? 'Pregunta de postulación'}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                      {answerValue(answer)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No se enviaron respuestas nativas para este registro.
              </p>
            )}
          </div>

          {isPending ? (
            <div className="flex gap-2 lg:flex-col">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isActionPending || isProcessing}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={isActionPending || isProcessing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </div>
          ) : null}
        </div>
      </article>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Rechazar postulación?</DialogTitle>
            <DialogDescription>
              Rechazar la postulación de {application.User.name} para este evento.
              {!showCheckbox && (
                <span className="mt-2 block text-sm text-muted-foreground">
                  La persona postulante recibira una notificacion por correo. La nota opcional queda interna en v1.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="mb-2 block text-sm font-medium">
              Nota interna (opcional)
            </label>
            <Textarea
              placeholder="Agrega contexto interno para esta decisión..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Esta nota solo es visible para editores; no se comparte con la persona postulante.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isActionPending}>
              {isActionPending ? 'Procesando...' : 'Rechazar postulación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
