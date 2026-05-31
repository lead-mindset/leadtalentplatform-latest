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
  compact?: boolean
  responsiveLabel?: boolean
  className?: string
}

export function SaveStudentButton({
  studentId,
  studentName,
  initialSaved,
  compact = false,
  responsiveLabel = false,
  className,
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
      size={compact ? 'sm' : 'default'}
      aria-label={isSaved ? `Quitar ${studentName} de talento guardado` : `Guardar ${studentName} en talento guardado`}
      title={isSaved ? 'Quitar de talento guardado' : 'Guardar perfil'}
      className={cn('gap-2 shrink-0', compact && 'gap-1.5', className)}
    >
      {isPending ? (
        <Loader2 className={cn(compact ? 'h-3 w-3' : 'h-4 w-4', 'animate-spin')} />
      ) : (
        <Heart className={cn(compact ? 'h-3 w-3' : 'h-4 w-4', isSaved && 'fill-current')} />
      )}
      <span className={cn(responsiveLabel && 'hidden xl:inline')}>
        {isSaved ? 'Guardado' : compact ? 'Guardar' : 'Guardar perfil'}
      </span>
    </Button>
  )
}
