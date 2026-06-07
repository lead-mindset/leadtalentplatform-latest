'use client'

import { useState } from 'react'
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { Icons } from '@/components/ui/icons'
import { Checkbox } from '@/components/ui/checkbox'
import type { EventApplicationQuestionRow } from '@/lib/types'

type ApplicationAnswerPayload = {
  questionId: string
  value: string | string[] | null
}

interface ApplyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  questions?: EventApplicationQuestionRow[]
  submissionError?: string | null
  onConfirm: (
    subscribeToHostChapters: boolean,
    answers: ApplicationAnswerPayload[]
  ) => Promise<boolean | void>
  isSubmitting?: boolean
}

export function ApplyModal({
  open,
  onOpenChange,
  eventTitle,
  questions = [],
  submissionError = null,
  onConfirm,
  isSubmitting = false,
}: ApplyModalProps) {
  const [subscribeToHostChapters, setSubscribeToHostChapters] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const resetFormState = () => {
    setSubscribeToHostChapters(true)
    setAnswers({})
    setFieldErrors({})
  }

  const isAnswerPresent = (value: string | string[] | undefined): boolean => {
    if (Array.isArray(value)) return value.length > 0
    return typeof value === 'string' && value.trim().length > 0
  }

  const isValidUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const validateAnswers = (): boolean => {
    const nextErrors: Record<string, string> = {}

    if (questions.length === 0) {
      nextErrors._form = 'Este evento aún no tiene preguntas de postulación configuradas.'
    }

    for (const question of questions) {
      const value = answers[question.id]

      if (question.is_required && !isAnswerPresent(value)) {
        nextErrors[question.id] = 'Esta pregunta es obligatoria.'
        continue
      }

      if (
        question.question_type === 'url' &&
        typeof value === 'string' &&
        value.trim() &&
        !isValidUrl(value.trim())
      ) {
        nextErrors[question.id] = 'Ingresa una URL valida con http o https.'
      }
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildAnswerPayload = (): ApplicationAnswerPayload[] =>
    questions.map((question) => ({
      questionId: question.id,
      value: answers[question.id] ?? null,
    }))

  const handleConfirm = async () => {
    if (!validateAnswers()) return

    const confirmed = await onConfirm(subscribeToHostChapters, buildAnswerPayload())
    if (confirmed === false) return

    onOpenChange(false)
    setTimeout(resetFormState, 300)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setTimeout(resetFormState, 300)
  }

  const updateAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    setFieldErrors((current) => {
      if (!current[questionId]) return current
      const next = { ...current }
      delete next[questionId]
      return next
    })
  }

  const toggleCheckboxAnswer = (questionId: string, option: string, checked: boolean) => {
    setAnswers((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] as string[] : []
      return {
        ...current,
        [questionId]: checked
          ? Array.from(new Set([...selected, option]))
          : selected.filter((item) => item !== option),
      }
    })
    setFieldErrors((current) => {
      if (!current[questionId]) return current
      const next = { ...current }
      delete next[questionId]
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Postular a {eventTitle}</DialogTitle>
          <DialogDescription>
            Responde estas preguntas dentro de LEAD. Tu postulación quedará en revisión.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <label className="min-w-0 flex-1 text-sm font-medium leading-6">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pregunta {index + 1}
                  </span>
                  {question.question_text}
                </label>
                {question.is_required ? <Badge variant="outline">Obligatoria</Badge> : null}
              </div>

              {question.question_type === 'long_text' ? (
                <textarea
                  value={(answers[question.id] as string | undefined) ?? ''}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  aria-invalid={Boolean(fieldErrors[question.id])}
                  placeholder="Escribe tu respuesta..."
                  className={`min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    fieldErrors[question.id] ? 'border-destructive' : 'border-input'
                  }`}
                />
              ) : question.question_type === 'single_select' ? (
                <select
                  value={(answers[question.id] as string | undefined) ?? ''}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  aria-invalid={Boolean(fieldErrors[question.id])}
                  className={`h-10 w-full rounded-md border bg-background px-3 text-sm ${
                    fieldErrors[question.id] ? 'border-destructive' : 'border-input'
                  }`}
                >
                  <option value="">Selecciona una opcion</option>
                  {(question.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : question.question_type === 'checkbox' ? (
                <div className="space-y-2">
                  {(question.options ?? []).map((option) => {
                    const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : []
                    return (
                      <label key={option} className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                        <Checkbox
                          checked={selected.includes(option)}
                          onCheckedChange={(checked) => toggleCheckboxAnswer(question.id, option, checked === true)}
                          aria-invalid={Boolean(fieldErrors[question.id])}
                        />
                        {option}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <input
                  type={question.question_type === 'url' ? 'url' : 'text'}
                  value={(answers[question.id] as string | undefined) ?? ''}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  aria-invalid={Boolean(fieldErrors[question.id])}
                  placeholder={question.question_type === 'url' ? 'https://...' : 'Escribe tu respuesta...'}
                  className={`h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    fieldErrors[question.id] ? 'border-destructive' : 'border-input'
                  }`}
                />
              )}

              {fieldErrors[question.id] ? (
                <p className="text-xs text-destructive">{fieldErrors[question.id]}</p>
              ) : null}
            </div>
          ))}

          {fieldErrors._form ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {fieldErrors._form}
            </div>
          ) : null}

          {submissionError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submissionError}
            </div>
          ) : null}

          <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <Checkbox
              checked={subscribeToHostChapters}
              onCheckedChange={(checked) => setSubscribeToHostChapters(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground">
              Enviarme novedades del capítulo anfitrión y capítulos colaboradores de este evento.
            </span>
          </label>
        </div>

        <DialogFooter className="gap-3 pt-4 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando
              </>
            ) : (
              'Enviar postulación'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
