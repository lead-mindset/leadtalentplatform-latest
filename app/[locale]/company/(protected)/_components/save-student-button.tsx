'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Loader2 } from 'lucide-react'
import { toggleSaveStudentAction } from '@/lib/actions/company/toggle-save'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SaveStudentButtonProps {
  studentId: string
  studentName: string
  initialSaved: boolean
}

export function SaveStudentButton({
  studentId,
  studentName,
  initialSaved,
}: SaveStudentButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      setIsSaved(prev => !prev)

      const result = await toggleSaveStudentAction(studentId, isSaved)

      if (!result.success) {
        setIsSaved(isSaved)
        toast.error(result.error || 'No se pudo actualizar el guardado')
      } else {
        toast.success(
          result.isSaved
            ? `${studentName} se guardo en tu lista`
            : `${studentName} se quito de talento guardado`
        )
      }
    })
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={isSaved ? 'default' : 'outline'}
      className="gap-2 shrink-0"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
      )}
      {isSaved ? 'Guardado' : 'Guardar perfil'}
    </Button>
  )
}
