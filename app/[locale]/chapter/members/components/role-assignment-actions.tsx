'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, UserCog, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CHAPTER_FUNCTIONAL_AREA_LABELS,
  CHAPTER_FUNCTIONAL_AREA_OPTIONS,
  CHAPTER_ROLE_LEVEL_LABELS,
  REGULAR_EBOARD_ROLE_OPTIONS,
  type RegularEboardRoleLevel,
} from '@/lib/chapter-role-options'
import type { ActiveChapterRoleAssignment } from '@/lib/types'
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'
import {
  assignRegularChapterRole,
  deactivateChapterRoleAssignment,
} from '@/lib/actions/chapter/role-assignments'

type Props = {
  targetUserId: string
  targetName: string
  assignment: ActiveChapterRoleAssignment | null
}

const DEFAULT_ROLE: RegularEboardRoleLevel = 'director'
const DEFAULT_AREA: ChapterFunctionalArea = 'other'

function isRegularRole(value: string | null | undefined): value is RegularEboardRoleLevel {
  return value === 'chief_of_staff' || value === 'director' || value === 'coordinator'
}

export function RoleAssignmentActions({ targetUserId, targetName, assignment }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [assignOpen, setAssignOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [roleLevel, setRoleLevel] = useState<RegularEboardRoleLevel>(
    isRegularRole(assignment?.role_level) ? assignment.role_level : DEFAULT_ROLE
  )
  const [functionalArea, setFunctionalArea] = useState<ChapterFunctionalArea>(
    (assignment?.functional_area as ChapterFunctionalArea | undefined) ?? DEFAULT_AREA
  )
  const [displayTitle, setDisplayTitle] = useState(assignment?.display_title ?? '')
  const [removeReason, setRemoveReason] = useState('')

  const hasProtectedAssignment =
    assignment?.role_level === 'president' || assignment?.role_level === 'vice_president'

  function submitAssignment() {
    startTransition(async () => {
      const result = await assignRegularChapterRole({
        targetUserId,
        roleLevel,
        functionalArea,
        displayTitle,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`${targetName} ahora tiene un rol e-board`)
      setAssignOpen(false)
      router.refresh()
    })
  }

  function submitRemoval() {
    const reason = removeReason.trim()
    if (!assignment?.id || !reason) {
      toast.error('Ingresa un motivo para retirar el rol')
      return
    }

    startTransition(async () => {
      const result = await deactivateChapterRoleAssignment({
        roleAssignmentId: assignment.id,
        reason,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`Rol e-board retirado para ${targetName}`)
      setRemoveOpen(false)
      setRemoveReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3 text-left">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ROL E-BOARD</p>
          {assignment ? (
            <>
              <p className="mt-0.5 break-words text-sm font-semibold text-primary">
                {assignment.display_title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {CHAPTER_FUNCTIONAL_AREA_LABELS[assignment.functional_area as ChapterFunctionalArea] ?? assignment.functional_area}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-sm font-medium">Sin rol e-board asignado</p>
          )}
        </div>
      </div>

      {hasProtectedAssignment ? (
        <div className="border-t pt-2">
          <p className="text-[11px] text-muted-foreground/60">
            Gestionado por admin
          </p>
        </div>
      ) : (
        <div className="min-h-[2.25rem]">
          <div className="flex flex-wrap gap-2">
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant={assignment ? 'outline' : 'default'} className="gap-1.5">
                  <UserCog className="h-4 w-4" />
                  {assignment ? 'Cambiar rol' : 'Asignar rol'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar rol e-board</DialogTitle>
                  <DialogDescription>
                    Define el nivel, área y título visible para {targetName}.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <Select value={roleLevel} onValueChange={(value) => setRoleLevel(value as RegularEboardRoleLevel)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGULAR_EBOARD_ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Área funcional</Label>
                    <Select value={functionalArea} onValueChange={(value) => setFunctionalArea(value as ChapterFunctionalArea)}>
                      <SelectTrigger className="w-full">
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

                  <Input
                    label="Título visible"
                    value={displayTitle}
                    onChange={(event) => setDisplayTitle(event.target.value)}
                    placeholder="Ej. Directora de Marketing"
                    helperText="Este título aparece en la plataforma; el nivel normalizado se usa para permisos."
                  />
                </div>

                <DialogFooter>
                  <Button
                    onClick={submitAssignment}
                    disabled={isPending || displayTitle.trim().length < 2}
                  >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2 h-4 w-4" />}
                    Guardar rol
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {assignment ? (
              <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-1.5">
                    <XCircle className="h-4 w-4" />
                    Retirar rol
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Retirar rol e-board</DialogTitle>
                    <DialogDescription>
                      La membresía seguirá aprobada. Solo se desactivará el rol y sus permisos.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={removeReason}
                    onChange={(event) => setRemoveReason(event.target.value)}
                    placeholder="Motivo requerido para auditoría interna"
                    rows={4}
                  />
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={submitRemoval}
                      disabled={isPending || removeReason.trim().length === 0}
                    >
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Confirmar retiro
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
