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

interface ApplyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  applicationFormUrl: string
  onConfirm: (subscribeToHostChapters: boolean) => Promise<void>
  isSubmitting?: boolean
}

export function ApplyModal({
  open,
  onOpenChange,
  eventTitle,
  applicationFormUrl,
  onConfirm,
  isSubmitting = false,
}: ApplyModalProps) {
  const [step, setStep] = useState<'form' | 'confirmation'>('form')
  const [subscribeToHostChapters, setSubscribeToHostChapters] = useState(true)

  const handleOpenForm = () => {
    window.open(applicationFormUrl, '_blank')
    setStep('confirmation')
  }

  const handleConfirm = async () => {
    await onConfirm(subscribeToHostChapters)
    onOpenChange(false)
    setTimeout(() => {
      setStep('form')
      setSubscribeToHostChapters(true)
    }, 300)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep('form')
      setSubscribeToHostChapters(true)
    }, 300)
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
