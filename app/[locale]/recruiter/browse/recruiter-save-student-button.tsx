'use client'

import { useState, useTransition } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { saveStudent, unsaveStudent } from '@/lib/actions/recruiter/talent-pool'

type RecruiterSaveStudentButtonProps = {
  studentId: string
  studentName: string
  initialSaved: boolean
  onSavedChange?: (isSaved: boolean) => void
}

export function RecruiterSaveStudentButton({
  studentId,
  studentName,
  initialSaved,
  onSavedChange,
}: RecruiterSaveStudentButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const onToggle = () => {
    startTransition(async () => {
      const nextSaved = !isSaved
      setIsSaved(nextSaved)

      const result = nextSaved ? await saveStudent(studentId) : await unsaveStudent(studentId)
      if (!result.success) {
        setIsSaved(!nextSaved)
        toast.error(result.error ?? 'Failed to update saved status.')
        return
      }

      onSavedChange?.(nextSaved)
      toast.success(nextSaved ? `${studentName} saved` : `${studentName} removed from saved`)
    })
  }

  return (
    <Button variant={isSaved ? 'default' : 'outline'} size="sm" onClick={onToggle} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
      )}
    </Button>
  )
}
