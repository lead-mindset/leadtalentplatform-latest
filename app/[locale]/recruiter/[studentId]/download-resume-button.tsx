'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadResume } from '@/lib/actions/recruiter/student-profile'

type DownloadResumeButtonProps = {
  studentId: string
}

export function DownloadResumeButton({ studentId }: DownloadResumeButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      onClick={() => {
        startTransition(async () => {
          const result = await downloadResume(studentId)
          if ('error' in result) {
            toast.error(result.error ?? 'Failed to download resume.')
            return
          }

          window.open(result.url, '_blank', 'noopener,noreferrer')
        })
      }}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing download...
        </>
      ) : (
        'Download resume'
      )}
    </Button>
  )
}
