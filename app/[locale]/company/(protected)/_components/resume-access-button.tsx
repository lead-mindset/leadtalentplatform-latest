'use client'

import { useTransition } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { openTalentResumeAction } from '@/lib/actions/company/resume'

interface ResumeAccessButtonProps {
  profileId: string
}

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
      toast.success('Resume opened in a new tab')
    })
  }

  return (
    <Button onClick={handleOpen} disabled={isPending} className="gap-2">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Open Resume
    </Button>
  )
}
