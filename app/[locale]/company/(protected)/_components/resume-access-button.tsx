'use client'

import { useTransition } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { openTalentResumeAction } from '@/lib/actions/company/resume'

interface ResumeAccessButtonProps {
  profileId: string
}

export const RESUME_ACCESS_COPY = {
  open: 'Abrir CV',
  success: 'CV abierto en una nueva pesta\u00f1a',
} as const

export function ResumeAccessButton({ profileId }: ResumeAccessButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleOpen = () => {
    startTransition(async () => {
      const result = await openTalentResumeAction(profileId)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      window.open(result.url, '_blank', 'noopener,noreferrer')
      toast.success(RESUME_ACCESS_COPY.success)
    })
  }

  return (
    <Button onClick={handleOpen} disabled={isPending} className="gap-2">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {RESUME_ACCESS_COPY.open}
    </Button>
  )
}
