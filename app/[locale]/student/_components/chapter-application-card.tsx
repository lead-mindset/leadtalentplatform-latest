'use client'

import { FormEvent, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/routing'
import { applyToChapter } from '@/lib/actions/chapter/apply'
import type { StudentDashboardChapterOption } from '@/lib/services/student-dashboard.service'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ChapterApplicationCardProps = {
  chapters: StudentDashboardChapterOption[]
  disabled?: boolean
}

export function ChapterApplicationCard({ chapters, disabled = false }: ChapterApplicationCardProps) {
  const router = useRouter()
  const [chapterId, setChapterId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const hasChapters = chapters.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!chapterId) {
      setError('Elige un capitulo para continuar.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await applyToChapter({ chapterId })

      if (!result.success) {
        const message = result.error ?? 'No se pudo enviar tu solicitud de capitulo.'
        setError(message)
        toast.error(message)
        return
      }

      toast.success('Tu solicitud de capitulo esta pendiente de revision.')
      router.refresh()
    })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="chapter-application">
          Capitulo
        </label>
        <Select
          value={chapterId}
          onValueChange={setChapterId}
          disabled={disabled || isPending || !hasChapters}
        >
          <SelectTrigger id="chapter-application" className="h-11 w-full rounded-lg">
            <SelectValue placeholder={hasChapters ? 'Elige tu capitulo' : 'No hay capitulos disponibles'} />
          </SelectTrigger>
          <SelectContent>
            {chapters.map((chapter) => {
              const label = `${chapter.name} - ${chapter.university}`
              return (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={disabled || isPending || !hasChapters}
      >
        {isPending ? 'Enviando...' : 'Postular a capitulo'}
      </Button>
    </form>
  )
}
