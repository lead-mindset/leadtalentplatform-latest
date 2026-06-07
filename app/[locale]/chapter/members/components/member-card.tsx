import { ChevronDown } from 'lucide-react'
import type { MemberWithProfile } from '@/lib/types'
import type { ChapterMemberPermissionFlags } from '@/lib/services/chapter.service'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/ui/icons'
import { CHAPTER_ROLE_LEVEL_LABELS } from '@/lib/chapter-role-options'
import { MemberActionButtons } from './member-actions'
import { RoleAssignmentActions } from './role-assignment-actions'

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
  const hasMemberBadges = Boolean(profile?.is_recruiter_visible || !profile)
  const roleControls = (
    <RoleAssignmentActions
      targetUserId={member.id}
      targetName={member.name ?? member.email}
      assignment={roleAssignment}
    />
  )

  return (
    <article className="grid min-w-0 gap-4 px-4 py-4 transition-colors hover:bg-muted/[0.035] sm:px-5 min-[1100px]:grid-cols-[minmax(9.5rem,0.9fr)_minmax(13rem,1.35fr)_minmax(10rem,0.8fr)] min-[1100px]:items-center">
      <div className="flex min-w-0 gap-3">
        {showSelector ? (
          <Checkbox
            className="mt-1"
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            aria-label={`Seleccionar ${member.name ?? 'miembro'}`}
          />
        ) : null}

        <div className="min-w-0 space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icons.User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="break-words text-base font-semibold leading-tight text-foreground">{member.name ?? 'Sin nombre registrado'}</div>
              {permissions.canViewMemberContact ? (
                <>
                  <div className="mt-1 break-all text-sm text-muted-foreground">{member.email}</div>
                  {member.phone ? (
                    <div className="mt-1 text-sm text-muted-foreground">{member.phone}</div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {hasMemberBadges ? (
            <div className="flex flex-wrap gap-2">
              {profile?.is_recruiter_visible ? (
                <Badge variant="info" size="sm">Visible para empresas</Badge>
              ) : null}
              {!profile ? (
                <Badge variant="outline" size="sm">Perfil incompleto</Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 space-y-3 text-sm">
        {profile ? (
          <>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="break-words font-medium leading-snug">
                {profile.major_or_interest || 'Área no registrada'}
              </span>
              {graduationYear ? (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{graduationYear}</span>
                </>
              ) : null}
            </div>

            {profile.linkedin_url ? (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-muted"
              >
                <Icons.Linkedin className="h-4 w-4 shrink-0" />
                <span className="truncate">LinkedIn</span>
                <Icons.ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            ) : null}

            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 3).map((skill: string) => (
                  <Badge key={skill} variant="secondary" size="sm">
                    {skill}
                  </Badge>
                ))}
                {profile.skills.length > 3 ? (
                  <Badge variant="neutral" size="sm">+{profile.skills.length - 3}</Badge>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Este miembro todavía no completó su perfil básico.
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2 border-t pt-3 min-[1100px]:border-l min-[1100px]:border-t-0 min-[1100px]:pl-4 min-[1100px]:pt-0 min-[1100px]:text-right">
        <div className="flex flex-wrap gap-1.5 min-[1100px]:justify-end">
          {positionLabel ? (
            <Badge variant="secondary" size="sm">{positionLabel}</Badge>
          ) : roleLevelLabel ? null : (
            <Badge variant="outline" size="sm">Miembro</Badge>
          )}
          {roleLevelLabel ? (
            <Badge variant="info" size="sm">
              {roleLevelLabel}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {membership?.member_id ? (
            <div className="font-medium text-foreground/80">{membership.member_id}</div>
          ) : null}
          {joinedAt ? (
            <div>Ingreso: {joinedAt}</div>
          ) : null}
        </div>

        {isPending && permissions.canManageApplications ? (
          <MemberActionButtons
            userId={member.id}
            userName={member.name ?? member.email}
            currentState="pending"
          />
        ) : null}

        {isApproved && permissions.canRevokeMembers && !isCurrentUser ? (
          <MemberActionButtons
            userId={member.id}
            userName={member.name ?? member.email}
            currentState="approved"
          />
        ) : null}

        {isApproved && permissions.canAssignEboard ? (
          <>
            <details className="group rounded-lg border bg-muted/20 text-left min-[1100px]:hidden">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium">
                <span>Gestionar rol e-board</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t p-3">
                {roleControls}
              </div>
            </details>
            <div className="hidden min-[1100px]:block">
              {roleControls}
            </div>
          </>
        ) : null}

        {isRejected ? (
          <div className="rounded-md border bg-muted/40 p-3 text-left text-xs text-muted-foreground min-[1100px]:text-right">
            Las postulaciones rechazadas son de solo lectura en esta vista.
          </div>
        ) : null}

        {isAlumni || isInactive ? (
          <div className="rounded-md border bg-muted/40 p-3 text-left text-xs text-muted-foreground min-[1100px]:text-right">
            {isAlumni
              ? 'Los registros alumni son de solo lectura en esta vista.'
              : 'Las membresías inactivas son de solo lectura en esta vista.'}
          </div>
        ) : null}
      </div>
    </article>
  )
}
