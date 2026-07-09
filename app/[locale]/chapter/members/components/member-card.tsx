'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Loader2, UserCog, XCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MemberWithProfile } from '@/lib/types'
import type { ChapterMemberPermissionFlags } from '@/lib/services/chapter.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/ui/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import type { ChapterFunctionalArea } from '@/lib/services/chapter-role-assignment.service'
import { approveMember, rejectMember, revokeApproval } from '@/lib/actions/chapter/check-students'
import {
  assignRegularChapterRole,
  deactivateChapterRoleAssignment,
} from '@/lib/actions/chapter/role-assignments'
import type { ActiveChapterRoleAssignment } from '@/lib/types'

function formatPosition(position?: string | null) {
  return position ? position.replaceAll('_', ' ') : 'member'
}

function formatJoinedAt(joinedAt?: string | null) {
  if (!joinedAt) return null
  return new Date(joinedAt).toLocaleDateString('es-PE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const DEFAULT_ROLE: RegularEboardRoleLevel = 'director'
const DEFAULT_AREA: ChapterFunctionalArea = 'other'

function isRegularRole(value: string | null | undefined): value is RegularEboardRoleLevel {
  return value === 'chief_of_staff' || value === 'director' || value === 'coordinator'
}

export default function MemberCard({
  member,
  selected = false,
  onSelectChange,
  showSelector = false,
  permissions,
  currentUserId,
}: {
  member: MemberWithProfile
  selected?: boolean
  onSelectChange?: (checked: boolean) => void
  showSelector?: boolean
  permissions: ChapterMemberPermissionFlags
  currentUserId: string
}) {
  const router = useRouter()
  const profile = member.person_profile
  const membership = member.chapter_membership
  const roleAssignment = member.chapter_role_assignment
  const status = membership?.status
  const isPending = Boolean(profile) && status === 'pending'
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'
  const isAlumni = status === 'alumni'
  const isInactive = status === 'inactive'
  const isCurrentUser = member.id === currentUserId
  const graduationYear = profile?.graduation_year ? `Prom. ${profile.graduation_year}` : null
  const joinedAt = formatJoinedAt(membership?.joined_at)
  const positionLabel = membership?.position && membership.position !== 'member'
    ? formatPosition(membership.position)
    : null
  const roleLevelLabel = roleAssignment && roleAssignment.role_level !== 'member'
    ? CHAPTER_ROLE_LEVEL_LABELS[roleAssignment.role_level as keyof typeof CHAPTER_ROLE_LEVEL_LABELS] ?? roleAssignment.role_level
    : null
  const hasProtectedAssignment =
    roleAssignment?.role_level === 'president' || roleAssignment?.role_level === 'vice_president'
  const hasNoProfile = Boolean(!profile)

  // ── role assignment dialog state ──
  const [isPendingAction, startTransition] = useTransition()
  const [assignOpen, setAssignOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [assignRoleLevel, setAssignRoleLevel] = useState<RegularEboardRoleLevel>(
    isRegularRole(roleAssignment?.role_level) ? roleAssignment.role_level : DEFAULT_ROLE
  )
  const [assignFunctionalArea, setAssignFunctionalArea] = useState<ChapterFunctionalArea>(
    (roleAssignment?.functional_area as ChapterFunctionalArea | undefined) ?? DEFAULT_AREA
  )
  const [assignDisplayTitle, setAssignDisplayTitle] = useState(roleAssignment?.display_title ?? '')
  const [removeReason, setRemoveReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [revokeReason, setRevokeReason] = useState('')

  function submitAssignment() {
    startTransition(async () => {
      const result = await assignRegularChapterRole({
        targetUserId: member.id,
        roleLevel: assignRoleLevel,
        functionalArea: assignFunctionalArea,
        displayTitle: assignDisplayTitle,
      })
      if (!result.success) { toast.error(result.error); return }
      toast.success(`${member.name ?? member.email} ahora tiene un rol e-board`)
      setAssignOpen(false)
      router.refresh()
    })
  }

  function submitRemoval() {
    const reason = removeReason.trim()
    if (!roleAssignment?.id || !reason) { toast.error('Ingresa un motivo'); return }
    startTransition(async () => {
      const result = await deactivateChapterRoleAssignment({ roleAssignmentId: roleAssignment.id, reason })
      if (!result.success) { toast.error(result.error); return }
      toast.success(`Rol e-board retirado para ${member.name ?? member.email}`)
      setRemoveOpen(false)
      setRemoveReason('')
      router.refresh()
    })
  }

  function submitRevoke() {
    const reason = revokeReason.trim()
    if (!reason) { toast.error('Ingresa un motivo'); return }
    startTransition(async () => {
      const result = await revokeApproval(member.id, reason)
      if ('error' in result) { toast.error(result.error); return }
      toast.success(`${member.name ?? member.email} ahora figura como inactivo`)
      setRevokeOpen(false)
      setRevokeReason('')
      router.refresh()
    })
  }

  function submitApprove() {
    startTransition(async () => {
      const result = await approveMember(member.id)
      if (result.success) {
        toast.success(`${member.name ?? member.email} aprobado`)
        router.refresh()
      } else {
        toast.error(result.error || 'Error al aprobar')
      }
    })
  }

  function submitReject() {
    startTransition(async () => {
      const result = await rejectMember(member.id, rejectReason || undefined)
      if (result.success) {
        toast.success(`Postulación de ${member.name ?? member.email} rechazada`)
        setRejectOpen(false)
        setRejectReason('')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al rechazar')
      }
    })
  }

  const canManage = permissions.canManageApplications && isPending
  const canRevoke = isApproved && permissions.canRevokeMembers && !isCurrentUser
  const canAssign = isApproved && permissions.canAssignEboard

  const hasAnyAction = canManage || canRevoke || canAssign

  // ── assign dialog (shared for assign + change) ──
  const assignDialog = (
    <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar rol e-board</DialogTitle>
          <DialogDescription>{member.name ?? member.email}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Nivel</Label>
            <Select value={assignRoleLevel} onValueChange={(v) => setAssignRoleLevel(v as RegularEboardRoleLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGULAR_EBOARD_ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Área funcional</Label>
            <Select value={assignFunctionalArea} onValueChange={(v) => setAssignFunctionalArea(v as ChapterFunctionalArea)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHAPTER_FUNCTIONAL_AREA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input label="Título visible" value={assignDisplayTitle} onChange={(e) => setAssignDisplayTitle(e.target.value)} placeholder="Ej. Directora de Marketing" />
        </div>
        <DialogFooter>
          <Button onClick={submitAssignment} disabled={isPendingAction || assignDisplayTitle.trim().length < 2}>
            {isPendingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar rol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // ── remove dialog ──
  const removeDialog = (
    <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar rol e-board</DialogTitle>
          <DialogDescription>La membresía seguirá aprobada. Solo se desactiva el rol.</DialogDescription>
        </DialogHeader>
        <Textarea value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} placeholder="Motivo requerido para auditoría interna" rows={4} />
        <DialogFooter>
          <Button variant="destructive" onClick={submitRemoval} disabled={isPendingAction || removeReason.trim().length === 0}>
            {isPendingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar retiro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // ── revoke dialog ──
  const revokeDialog = (
    <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revocar membresía</DialogTitle>
          <DialogDescription>{member.name ?? member.email} pasará a inactivo.</DialogDescription>
        </DialogHeader>
        <Textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} placeholder="Motivo requerido para auditoría interna" rows={4} />
        <DialogFooter>
          <Button variant="destructive" onClick={submitRevoke} disabled={isPendingAction || revokeReason.trim().length === 0}>
            {isPendingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar revocación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // ── reject dialog ──
  const rejectDialog = (
    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar postulación</DialogTitle>
          <DialogDescription>Nota interna opcional para editores.</DialogDescription>
        </DialogHeader>
        <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nota interna opcional" rows={3} />
        <DialogFooter>
          <Button variant="destructive" onClick={submitReject} disabled={isPendingAction}>
            {isPendingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar rechazo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <article className="grid min-w-0 gap-4 px-4 py-3 transition-colors hover:bg-muted/[0.035] sm:px-5 min-[1100px]:grid-cols-[minmax(9.5rem,0.9fr)_minmax(13rem,1.35fr)_minmax(10rem,0.8fr)_2.5rem] min-[1100px]:items-center">
      {/* ── Col 1: Miembro ── */}
      <div className="flex min-w-0 gap-3">
        {showSelector ? (
          <Checkbox
            className="mt-1"
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            aria-label={`Seleccionar ${member.name ?? 'miembro'}`}
          />
        ) : null}

        <div className="min-w-0 space-y-1">
          <div className="min-w-0">
            <div className="break-words text-sm text-foreground">{member.name ?? 'Sin nombre registrado'}</div>
            {permissions.canViewMemberContact ? (
              <>
                <div className="break-all text-xs text-muted-foreground">{member.email}</div>
                {membership?.member_id || member.phone ? (
                  <div className="text-xs text-muted-foreground/60">
                    {[membership?.member_id, member.phone].filter(Boolean).join(' · ')}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {hasNoProfile ? (
            <Badge variant="outline" size="sm">Perfil incompleto</Badge>
          ) : null}
        </div>
      </div>

      {/* ── Col 2: Perfil ── */}
      <div className="min-w-0 text-xs text-muted-foreground">
        {profile ? (
          <>
            <span>{profile.major_or_interest || 'Área no registrada'}</span>
            {graduationYear ? <span> · {graduationYear}</span> : null}
            {profile.linkedin_url ? <span> · <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a></span> : null}
          </>
        ) : (
          <span className="text-muted-foreground/60">Perfil pendiente</span>
        )}
      </div>

      {/* ── Col 3: Rol ── */}
      <div className="min-w-0 border-t pt-2 text-xs min-[1100px]:border-l min-[1100px]:border-t-0 min-[1100px]:pl-3 min-[1100px]:pt-0">
        {isRejected ? (
          <span className="text-muted-foreground/60">Postulación rechazada</span>
        ) : isAlumni ? (
          <span className="text-muted-foreground/60">Alumni — solo lectura</span>
        ) : isInactive ? (
          <span className="text-muted-foreground/60">Inactivo — solo lectura</span>
        ) : positionLabel ? (
          <Badge variant="secondary" size="sm">{positionLabel}</Badge>
        ) : roleLevelLabel ? (
          <Badge variant="info" size="sm">{roleLevelLabel}</Badge>
        ) : (
          <Badge variant="outline" size="sm">Miembro</Badge>
        )}
      </div>

      {/* ── Col 4: Acciones ── */}
      <div className="flex justify-center">
        {hasAnyAction ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              {canManage ? (
                <>
                  <DropdownMenuItem onSelect={() => submitApprove()}>
                    <CheckCircle2 className="h-4 w-4" />
                    Aprobar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRejectOpen(true)}>
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </DropdownMenuItem>
                </>
              ) : null}

              {canRevoke ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRevokeOpen(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Revocar membresía
                </DropdownMenuItem>
              ) : null}

              {canAssign && !hasProtectedAssignment ? (
                <>
                  {canRevoke || canManage ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
                    <UserCog className="h-4 w-4" />
                    {roleAssignment ? 'Cambiar rol e-board' : 'Asignar rol e-board'}
                  </DropdownMenuItem>
                  {roleAssignment ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setRemoveOpen(true)}
                    >
                      <XCircle className="h-4 w-4" />
                      Retirar rol e-board
                    </DropdownMenuItem>
                  ) : null}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {assignDialog}
      {removeDialog}
      {revokeDialog}
      {rejectDialog}
    </article>
  )
}
