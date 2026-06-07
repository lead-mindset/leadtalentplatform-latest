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
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Invitaciones e-board</h2>
            <Badge variant="outline">{invites.length} pendientes</Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Envía un enlace de acceso. Cuando la persona entre con ese correo, su rol e-board queda listo en este capítulo.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <MailPlus className="mr-2 h-4 w-4" />
              Invitar e-board
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Invitar e-board del capítulo</DialogTitle>
              <DialogDescription>
                Escribe el correo, elige el rol y envía el enlace. Vence en 30 días.
              </DialogDescription>
            </DialogHeader>

            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (canSubmit && !isPending) submitInvite()
              }}
            >
              <Input
                label="Correo de la persona"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="lider@example.edu"
                helperText="La persona debe iniciar sesión o crear cuenta con este mismo correo."
                autoComplete="email"
                autoFocus
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={roleLevel} onValueChange={(value) => setRoleLevel(value as RegularEboardRoleLevel)}>
                    <SelectTrigger className="w-full" aria-label="Rol">
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
                  <Label>Area</Label>
                  <Select value={functionalArea} onValueChange={(value) => setFunctionalArea(value as ChapterFunctionalArea)}>
                    <SelectTrigger className="w-full" aria-label="Area de trabajo">
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
                label="Titulo visible"
                value={displayTitle}
                onChange={(event) => setDisplayTitle(event.target.value)}
                placeholder={suggestedDisplayTitle}
                helperText={`Opcional. Si lo dejas vacio, se usara: ${suggestedDisplayTitle}.`}
              />

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Antes de enviar</p>
                <p className="mt-1 text-muted-foreground">
                  {email.trim() || 'correo@universidad.edu'} recibirá un enlace de 30 días para activar{' '}
                  <span className="font-medium text-foreground">{effectiveDisplayTitle}</span>.
                </p>
              </div>

              <DialogFooter className="pt-1">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending || !canSubmit}>
                  <Send className="mr-2 h-4 w-4" />
                {isPending ? 'Enviando...' : 'Enviar invitación'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {invites.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aún no hay invitaciones e-board. Cuando envíes una, podrás cancelarla o reenviarla si expira.
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {invites.map((invite) => (
            <div key={invite.id} className="grid gap-3 p-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm font-medium">{invite.email}</p>
                  <Badge variant={invite.status === 'expired' ? 'secondary' : 'outline'}>
                    {statusLabel(invite.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Invitada: {formatDate(invite.created_at)} / Expira: {formatDate(invite.expires_at)}
                </p>
              </div>

              <div className="min-w-0 text-sm">
                <p className="break-words font-medium">{invite.display_title}</p>
                <p className="text-xs text-muted-foreground">
                  {CHAPTER_ROLE_LEVEL_LABELS[invite.role_level as keyof typeof CHAPTER_ROLE_LEVEL_LABELS] ?? invite.role_level}
                  {' / '}
                  {CHAPTER_FUNCTIONAL_AREA_LABELS[invite.functional_area as ChapterFunctionalArea] ?? invite.functional_area}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
                {invite.status === 'expired' ? (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => reinvite(invite.id)}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reinvitar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => cancelInvite(invite.id)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
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
