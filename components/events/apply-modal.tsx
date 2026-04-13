'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle } from 'lucide-react'

interface ApplyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  applicationFormUrl: string
  onConfirm: () => Promise<void>
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
  const [hasOpenedForm, setHasOpenedForm] = useState(false)

  const handleOpenForm = () => {
    window.open(applicationFormUrl, '_blank')
    setHasOpenedForm(true)
    setStep('confirmation')
  }

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
    setTimeout(() => {
      setStep('form')
      setHasOpenedForm(false)
    }, 300)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep('form')
      setHasOpenedForm(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Application Required</DialogTitle>
              <DialogDescription>
                This event requires you to complete an application form before registering.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Event:</p>
                <p className="text-sm text-muted-foreground">{eventTitle}</p>
              </div>

              <p className="text-sm">
                Click the button below to open the application form. Complete and submit it, then return here to confirm.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleOpenForm}>
                Open Application Form
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
              <DialogDescription>
                Did you complete and submit the application form?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Form submitted?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    If you've completed the form, confirm below. You'll receive an email confirmation and we'll notify you when a decision is made.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setStep('form')}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : "Yes, I submitted it"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
