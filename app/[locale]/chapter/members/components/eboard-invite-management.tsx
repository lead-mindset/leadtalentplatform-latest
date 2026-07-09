'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MailPlus, RefreshCcw, Send, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
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
import {
  CHAPTER_FUNCTIONAL_AREA_LABELS,
  CHAPTER_FUNCTIONAL_AREA_OPTIONS,
  CHAPTER_ROLE_LEVEL_LABELS,
  REGULAR_EBOARD_ROLE_OPTIONS,
  type RegularEboardRoleLevel,
} from '@/lib/chapter-role-options'
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'
import type { ChapterEboardInvite } from '@/lib/services/chapter-eboard-invite.service'
import {
  cancelChapterEboardInvite,
  createChapterEboardInvite,
  reinviteExpiredChapterEboardInvite,
} from '@/lib/actions/chapter/eboard-invites'

type Props = {
  invites: ChapterEboardInvite[]
}

const DEFAULT_ROLE: RegularEboardRoleLevel = 'director'
const DEFAULT_AREA: ChapterFunctionalArea = 'events_experience'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function statusLabel(status: ChapterEboardInvite['status']) {
  return status === 'expired' ? 'Expirada' : 'Activa'
}

function getSuggestedDisplayTitle(
  roleLevel: RegularEboardRoleLevel,
  functionalArea: ChapterFunctionalArea
) {
  const roleLabel = CHAPTER_ROLE_LEVEL_LABELS[roleLevel]
  const areaLabel = CHAPTER_FUNCTIONAL_AREA_LABELS[functionalArea]

  if (functionalArea === 'other') return roleLabel
  return `${roleLabel} - ${areaLabel}`
}

export function EboardInviteManagement({ invites }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [displayTitle, setDisplayTitle] = useState('')
  const [roleLevel, setRoleLevel] = useState<RegularEboardRoleLevel>(DEFAULT_ROLE)
  const [functionalArea, setFunctionalArea] = useState<ChapterFunctionalArea>(DEFAULT_AREA)
  const suggestedDisplayTitle = getSuggestedDisplayTitle(roleLevel, functionalArea)
  const effectiveDisplayTitle = displayTitle.trim() || suggestedDisplayTitle
  const canSubmit = email.trim().length > 0 && effectiveDisplayTitle.length >= 2

  function resetForm() {
    setEmail('')
    setDisplayTitle('')
    setRoleLevel(DEFAULT_ROLE)
    setFunctionalArea(DEFAULT_AREA)
  }

  function submitInvite() {
    startTransition(async () => {
      const result = await createChapterEboardInvite({
        email,
        displayTitle: effectiveDisplayTitle,
        roleLevel,
        functionalArea,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitación enviada', {
        description: 'El enlace queda activo por 30 días y solo funciona con ese correo.',
      })
      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function cancelInvite(inviteId: string) {
    startTransition(async () => {
      const result = await cancelChapterEboardInvite({ inviteId })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitación cancelada')
      router.refresh()
    })
  }

  function reinvite(inviteId: string) {
    startTransition(async () => {
      const result = await reinviteExpiredChapterEboardInvite({ inviteId })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitación reenviada', {
        description: 'El enlace queda activo por 30 días más.',
      })
      router.refresh()
    })
  }

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Invitaciones e-board</span>
          {invites.length > 0 ? (
            <Badge variant="outline" size="sm">{invites.length}</Badge>
          ) : null}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <MailPlus className="mr-1.5 h-3.5 w-3.5" />
              Invitar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva invitación e-board</DialogTitle>
              <DialogDescription>
                La persona ingresa con este correo y su rol queda listo. Vence en 30 días.
              </DialogDescription>
            </DialogHeader>

            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (canSubmit && !isPending) submitInvite()
              }}
            >
              <Input
                label="Correo"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="lider@universidad.edu"
                autoComplete="email"
                autoFocus
                required
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Rol</Label>
                  <Select value={roleLevel} onValueChange={(value) => setRoleLevel(value as RegularEboardRoleLevel)}>
                    <SelectTrigger aria-label="Rol">
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

                <div className="space-y-1.5">
                  <Label className="text-xs">Área</Label>
                  <Select value={functionalArea} onValueChange={(value) => setFunctionalArea(value as ChapterFunctionalArea)}>
                    <SelectTrigger aria-label="Área">
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
              </div>

              <Input
                label="Título visible"
                value={displayTitle}
                onChange={(event) => setDisplayTitle(event.target.value)}
                placeholder={suggestedDisplayTitle}
                helperText={`Se usará: ${effectiveDisplayTitle}`}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="sm" disabled={isPending}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" size="sm" disabled={isPending || !canSubmit}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {isPending ? 'Enviando...' : 'Enviar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {invites.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin invitaciones activas.</p>
      ) : (
        <div className="divide-y">
          {invites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <span className="font-medium">{invite.email}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {invite.display_title} &middot; {statusLabel(invite.status)}
                </span>
              </div>
              <div className="shrink-0">
                {invite.status === 'expired' ? (
                  <Button size="sm" variant="ghost" disabled={isPending} onClick={() => reinvite(invite.id)}>
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" disabled={isPending} onClick={() => cancelInvite(invite.id)}>
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
