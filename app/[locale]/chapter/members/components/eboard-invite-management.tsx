'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MailPlus, RefreshCcw, Send, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
const DEFAULT_AREA: ChapterFunctionalArea = 'other'

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

export function EboardInviteManagement({ invites }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [displayTitle, setDisplayTitle] = useState('')
  const [roleLevel, setRoleLevel] = useState<RegularEboardRoleLevel>(DEFAULT_ROLE)
  const [functionalArea, setFunctionalArea] = useState<ChapterFunctionalArea>(DEFAULT_AREA)

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
        displayTitle,
        roleLevel,
        functionalArea,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitacion enviada')
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

      toast.success('Invitacion cancelada')
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

      toast.success('Invitacion reenviada')
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
            Invita roles e-board regulares. Presidencia y vicepresidencia siguen bajo control admin.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <MailPlus className="mr-2 h-4 w-4" />
              Invitar e-board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar miembro e-board</DialogTitle>
              <DialogDescription>
                La persona debe crear su cuenta usando exactamente el correo invitado.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <Input
                label="Correo"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="lider@example.edu"
              />

              <Input
                label="Titulo visible"
                value={displayTitle}
                onChange={(event) => setDisplayTitle(event.target.value)}
                placeholder="Ej. Directora de Eventos"
              />

              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label>Area funcional</Label>
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
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={submitInvite}
                disabled={isPending || email.trim().length === 0 || displayTitle.trim().length < 2}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar invitacion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {invites.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No hay invitaciones e-board pendientes.
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
