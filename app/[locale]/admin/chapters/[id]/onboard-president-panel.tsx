'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CHAPTER_FUNCTIONAL_AREA_OPTIONS } from '@/lib/chapter-role-options'
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'
import { onboardPresidentAction } from '@/lib/actions/admin/onboard-president'

type Props = {
  chapterId: string
}

const DEFAULT_AREA: ChapterFunctionalArea = 'general_leadership'

export function OnboardPresidentPanel({ chapterId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [functionalArea, setFunctionalArea] = useState<ChapterFunctionalArea>(DEFAULT_AREA)
  const [displayTitle, setDisplayTitle] = useState('')

  const effectiveTitle = displayTitle.trim() || 'President'
  const canSubmit = email.trim().length > 0

  function resetForm() {
    setEmail('')
    setFunctionalArea(DEFAULT_AREA)
    setDisplayTitle('')
  }

  function submit() {
    startTransition(async () => {
      const result = await onboardPresidentAction({
        chapterId,
        email,
        functionalArea,
        displayTitle: effectiveTitle,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Presidente activado', {
        description: 'La cuenta, membresia y rol quedaron listos.',
      })
      resetForm()
      router.refresh()
    })
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Onboarding directo de presidente</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Activa la cuenta, la membresia aprobada, el rol de presidente y la identidad al instante. No requiere enlace.
          </p>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-md border bg-muted/20 p-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSubmit && !isPending) submit()
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="presidencia@universidad.edu"
            helperText="Si no existe, se crea la cuenta y se confirma el correo."
            autoComplete="email"
            required
          />

          <div className="space-y-2">
            <Label>Area</Label>
            <Select value={functionalArea} onValueChange={(value) => setFunctionalArea(value as ChapterFunctionalArea)}>
              <SelectTrigger className="w-full" aria-label="Area de liderazgo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHAPTER_FUNCTIONAL_AREA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cargo visible</Label>
            <Input
              value={displayTitle}
              onChange={(event) => setDisplayTitle(event.target.value)}
              placeholder="President"
            />
          </div>
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit || isPending}>
          <UserPlus className="mr-2 h-4 w-4" />
          {isPending ? 'Activando...' : 'Activar presidente'}
        </Button>
      </form>
    </section>
  )
}
