'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MailPlus, RefreshCcw, ShieldCheck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import {
  CHAPTER_FUNCTIONAL_AREA_LABELS,
  CHAPTER_FUNCTIONAL_AREA_OPTIONS,
  CHAPTER_ROLE_LEVEL_LABELS,
} from '@/lib/chapter-role-options'
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'
import type {
  ActiveProtectedLeader,
  ProtectedLeadershipInvite,
} from '@/lib/services/chapter-protected-leadership-invite.service'
import {
  createAdminProtectedLeadershipInvite,
  reinviteExpiredAdminProtectedLeadershipInvite,
  revokeAdminProtectedLeadershipInvite,
} from '@/lib/actions/admin/chapter-invites'

type ProtectedRoleLevel = 'president' | 'vice_president'

type Props = {
  chapterId: string
  activeLeaders: ActiveProtectedLeader[]
  invites: ProtectedLeadershipInvite[]
}

const PROTECTED_ROLE_OPTIONS: Array<{ value: ProtectedRoleLevel; label: string }> = [
  { value: 'president', label: CHAPTER_ROLE_LEVEL_LABELS.president },
  { value: 'vice_president', label: CHAPTER_ROLE_LEVEL_LABELS.vice_president },
]

const DEFAULT_ROLE: ProtectedRoleLevel = 'president'
const DEFAULT_AREA: ChapterFunctionalArea = 'general_leadership'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function statusLabel(status: ProtectedLeadershipInvite['status']) {
  if (status === 'expired') return 'Expirada'
  if (status === 'accepted') return 'Aceptada'
  if (status === 'revoked') return 'Revocada'
  return 'Activa'
}

function suggestedTitle(roleLevel: ProtectedRoleLevel) {
  return CHAPTER_ROLE_LEVEL_LABELS[roleLevel]
}

export function ProtectedLeadershipInvites({ chapterId, activeLeaders, invites }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [roleLevel, setRoleLevel] = useState<ProtectedRoleLevel>(DEFAULT_ROLE)
  const [functionalArea, setFunctionalArea] = useState<ChapterFunctionalArea>(DEFAULT_AREA)
  const [displayTitle, setDisplayTitle] = useState('')
  const effectiveTitle = displayTitle.trim() || suggestedTitle(roleLevel)

  const blockedRoles = useMemo(() => {
    const blocked = new Set<ProtectedRoleLevel>()
    for (const leader of activeLeaders) blocked.add(leader.roleLevel)
    for (const invite of invites) {
      if (invite.status !== 'expired') blocked.add(invite.roleLevel)
    }
    return blocked
  }, [activeLeaders, invites])

  const isRoleBlocked = blockedRoles.has(roleLevel)
  const canSubmit = email.trim().length > 0 && effectiveTitle.length >= 2 && !isRoleBlocked

  function resetForm() {
    setEmail('')
    setRoleLevel(DEFAULT_ROLE)
    setFunctionalArea(DEFAULT_AREA)
    setDisplayTitle('')
  }

  function submitInvite() {
    startTransition(async () => {
      const result = await createAdminProtectedLeadershipInvite({
        chapterId,
        email,
        roleLevel,
        functionalArea,
        displayTitle: effectiveTitle,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitacion enviada', {
        description: 'El enlace queda activo por 30 dias.',
      })
      resetForm()
      router.refresh()
    })
  }

  function revokeInvite(inviteId: string) {
    startTransition(async () => {
      const result = await revokeAdminProtectedLeadershipInvite({ chapterId, inviteId })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitacion revocada')
      router.refresh()
    })
  }

  function reinvite(inviteId: string) {
    startTransition(async () => {
      const result = await reinviteExpiredAdminProtectedLeadershipInvite({ chapterId, inviteId })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitacion reenviada', {
        description: 'El nuevo enlace vence en 30 dias.',
      })
      router.refresh()
    })
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Presidencia y vicepresidencia</h2>
            <Badge variant="outline">{activeLeaders.length} activas</Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Invita lideres protegidos desde el capitulo. Solo puede existir una Presidencia y una Vicepresidencia activa o pendiente.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {PROTECTED_ROLE_OPTIONS.map((option) => {
          const active = activeLeaders.find((leader) => leader.roleLevel === option.value)
          const pending = invites.find((invite) => invite.roleLevel === option.value && invite.status !== 'expired')
          const expired = invites.find((invite) => invite.roleLevel === option.value && invite.status === 'expired')

          return (
            <div key={option.value} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">Rol protegido</p>
                </div>
                <Badge variant={active ? 'default' : pending ? 'outline' : 'secondary'}>
                  {active ? 'Activa' : pending ? 'Pendiente' : 'Disponible'}
                </Badge>
              </div>

              {active ? (
                <div className="mt-3 text-sm">
                  <p className="font-medium">{active.displayTitle}</p>
                  <p className="break-words text-muted-foreground">{active.name ?? active.email}</p>
                  <p className="break-words text-xs text-muted-foreground">{active.email}</p>
                </div>
              ) : pending ? (
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="font-medium">{pending.displayTitle}</p>
                    <p className="break-words text-muted-foreground">{pending.email}</p>
                    <p className="text-xs text-muted-foreground">Expira: {formatDate(pending.expiresAt)}</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => revokeInvite(pending.id)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Revocar
                  </Button>
                </div>
              ) : expired ? (
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="font-medium">{expired.displayTitle}</p>
                    <p className="break-words text-muted-foreground">{expired.email}</p>
                    <p className="text-xs text-muted-foreground">Expirada: {formatDate(expired.expiresAt)}</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => reinvite(expired.id)}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reinvitar
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Lista para invitar.
                </p>
              )}
            </div>
          )
        })}
      </div>

      <form
        className="grid gap-4 rounded-md border bg-muted/20 p-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSubmit && !isPending) submitInvite()
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="presidenta@example.edu"
            autoComplete="email"
            required
          />

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={roleLevel} onValueChange={(value) => setRoleLevel(value as ProtectedRoleLevel)}>
              <SelectTrigger className="w-full" aria-label="Rol protegido">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROTECTED_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={blockedRoles.has(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Input
            label="Cargo visible"
            value={displayTitle}
            onChange={(event) => setDisplayTitle(event.target.value)}
            placeholder={suggestedTitle(roleLevel)}
            helperText={
              isRoleBlocked
                ? 'Este rol ya tiene una persona activa o una invitacion pendiente.'
                : `${email.trim() || 'correo@universidad.edu'} recibira un enlace para aceptar ${effectiveTitle}.`
            }
          />
          <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit || isPending}>
            <MailPlus className="mr-2 h-4 w-4" />
            {isPending ? 'Enviando...' : 'Enviar invitacion'}
          </Button>
        </div>
      </form>

      {invites.length > 0 && (
        <div className="divide-y rounded-md border">
          {invites.map((invite) => (
            <div key={invite.id} className="grid gap-2 p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words font-medium">{invite.email}</p>
                  <Badge variant={invite.status === 'expired' ? 'secondary' : 'outline'}>
                    {statusLabel(invite.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {CHAPTER_ROLE_LEVEL_LABELS[invite.roleLevel]} / {CHAPTER_FUNCTIONAL_AREA_LABELS[invite.functionalArea]} / vence {formatDate(invite.expiresAt)}
                </p>
              </div>
              {invite.status === 'expired' ? (
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => reinvite(invite.id)}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reinvitar
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => revokeInvite(invite.id)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Revocar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
