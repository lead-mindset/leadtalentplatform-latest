'use client'

import { useState } from 'react'
import {
  Button,
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
  applicationFormUrl: string
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
  applicationFormUrl,
  questions = [],
  submissionError = null,
  onConfirm,
  isSubmitting = false,
}: ApplyModalProps) {
  const [step, setStep] = useState<'form' | 'confirmation'>('form')
  const [subscribeToHostChapters, setSubscribeToHostChapters] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const hasNativeQuestions = questions.length > 0

  const resetFormState = () => {
    setStep('form')
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

  const validateNativeAnswers = (): boolean => {
    const nextErrors: Record<string, string> = {}

    for (const question of questions) {
      const value = answers[question.id]

      if (question.is_required && !isAnswerPresent(value)) {
        nextErrors[question.id] = 'This question is required.'
        continue
      }

      if (
        question.question_type === 'url' &&
        typeof value === 'string' &&
        value.trim() &&
        !isValidUrl(value.trim())
      ) {
        nextErrors[question.id] = 'Enter a valid http or https URL.'
      }
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleOpenForm = () => {
    window.open(applicationFormUrl, '_blank')
    setStep('confirmation')
  }

  const handleConfirm = async () => {
    if (hasNativeQuestions && !validateNativeAnswers()) return

    const confirmed = await onConfirm(subscribeToHostChapters, buildAnswerPayload())
    if (confirmed === false) return

    onOpenChange(false)
    setTimeout(resetFormState, 300)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setTimeout(resetFormState, 300)
  }

  const buildAnswerPayload = (): ApplicationAnswerPayload[] =>
    questions.map((question) => ({
      questionId: question.id,
      value: answers[question.id] ?? null,
    }))

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

  if (hasNativeQuestions) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Apply to {eventTitle}</DialogTitle>
            <DialogDescription>
              Submit your application for editor review.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <label className="text-sm font-medium">
                  {question.question_text}
                  {question.is_required ? <span className="text-destructive"> *</span> : null}
                </label>

                {question.question_type === 'long_text' ? (
                  <textarea
                    value={(answers[question.id] as string | undefined) ?? ''}
                    onChange={(event) => updateAnswer(question.id, event.target.value)}
                    aria-invalid={Boolean(fieldErrors[question.id])}
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
                    <option value="">Select an option</option>
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
                Send me updates from the host and collaborator chapters for this event.
              </span>
            </label>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === 'form' ? (
          <>
            <DialogHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icons.FileText className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle className="text-xl font-semibold">Application Required</DialogTitle>
              <DialogDescription className="text-base mt-2">
                This event requires you to complete an application form before registering.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <p className="text-sm font-semibold">Event Details</p>
                </div>
                <p className="text-sm font-medium">{eventTitle}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Open Application Form</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click the button below to open the external application form in a new tab
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Complete & Submit</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fill out all required fields and submit the application
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Return & Confirm</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Come back to this page and confirm you've submitted the form
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-warning bg-warning/10 p-3">
                <div className="flex items-start gap-2">
                  <Icons.Clock className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Keep this tab open</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll need to return here to confirm your submission
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-0 pt-4">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleOpenForm}
                className="flex-1 sm:flex-none h-12"
              >
                <Icons.ExternalLink className="mr-2 w-4 h-4" />
                Open Application Form
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <Icons.CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <DialogTitle className="text-xl font-semibold">Confirm Your Application</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Did you complete and submit the application form?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <div className="flex items-start gap-3">
                  <Icons.CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Ready to confirm?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If you've successfully submitted the application form, click confirm below to complete your registration request.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-muted bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Icons.Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">What happens next?</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>· You'll receive an email confirmation</li>
                      <li>· We'll review your application</li>
                      <li>· You'll be notified of the decision</li>
                    </ul>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <Checkbox
                  checked={subscribeToHostChapters}
                  onCheckedChange={(checked) => setSubscribeToHostChapters(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-muted-foreground">
                  Send me updates from the host and collaborator chapters for this event.
                </span>
              </label>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Haven't submitted yet?
                </p>
                <Button 
                  variant="link" 
                  onClick={() => setStep('form')}
                  className="h-auto p-0 text-sm"
                >
                  Go back to application form
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-0 pt-4">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={isSubmitting}
                className="flex-1 sm:flex-none h-12"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Icons.CheckCircle2 className="mr-2 w-4 h-4" />
                    Yes, I submitted it
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
