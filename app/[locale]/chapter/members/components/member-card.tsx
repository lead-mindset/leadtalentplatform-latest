import type { MemberWithProfile } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Icons } from '@/components/ui/icons'
import { MemberActionButtons } from "./member-actions"

function statusConfig(status?: string | null) {
  if (status === 'approved') {
    return { label: 'Aprobado', variant: 'success' as const }
  }

  if (status === 'rejected') {
    return { label: 'Rechazado', variant: 'destructive' as const }
  }

  if (status === 'alumni') {
    return { label: 'Alumni', variant: 'neutral' as const }
  }

  return { label: 'Pendiente', variant: 'warning' as const }
}

function formatPosition(position?: string | null) {
  return position ? position.replaceAll('_', ' ') : 'member'
}

export default function MemberCard({
  member,
  selected = false,
  onSelectChange,
  showSelector = false,
}: {
  member: MemberWithProfile
  selected?: boolean
  onSelectChange?: (checked: boolean) => void
  showSelector?: boolean
}) {
  const profile = member.person_profile
  const membership = member.chapter_membership
  const status = membership?.status
  const isPending = Boolean(profile) && status === 'pending'
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'
  const isAlumni = status === 'alumni'
  const badge = statusConfig(status)

  return (
    <article className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(14rem,0.8fr)] lg:items-start">
      <div className="flex min-w-0 gap-3">
        {showSelector ? (
          <Checkbox
            className="mt-1"
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            aria-label={`Seleccionar ${member.name ?? member.email}`}
          />
        ) : null}

        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icons.User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{member.name ?? 'Sin nombre registrado'}</h3>
              <p className="mt-0.5 break-all text-sm text-muted-foreground">{member.email}</p>
              {member.phone ? (
                <p className="mt-1 text-sm text-muted-foreground">{member.phone}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {profile?.is_recruiter_visible ? (
              <Badge variant="info">Visible para empresas</Badge>
            ) : null}
            {!profile ? (
              <Badge variant="outline">Perfil incompleto</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-3 text-sm">
        {profile ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <Icons.GraduationCap className="h-4 w-4 shrink-0" />
                <span className="truncate">{profile.major_or_interest || 'Area no registrada'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icons.Calendar className="h-4 w-4 shrink-0" />
                <span>{profile.graduation_year ? `Promocion ${profile.graduation_year}` : 'Graduacion no registrada'}</span>
              </div>
            </div>

            {profile.linkedin_url ? (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1 text-primary underline underline-offset-4"
              >
                <span className="truncate">LinkedIn profile</span>
                <Icons.ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            ) : null}

            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 6).map((skill: string) => (
                  <Badge key={skill} variant="secondary" size="sm">
                    {skill}
                  </Badge>
                ))}
                {profile.skills.length > 6 ? (
                  <Badge variant="neutral" size="sm">+{profile.skills.length - 6}</Badge>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Este miembro todavia no completo su perfil basico.
          </p>
        )}
      </div>

      <div className="space-y-3 lg:text-right">
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {membership?.chapter_id ? (
            <Badge variant="outline">{member.chapter?.name ?? membership.chapter_id}</Badge>
          ) : null}
          {membership?.position ? (
            <Badge variant="secondary">{formatPosition(membership.position)}</Badge>
          ) : null}
          {membership?.member_id ? (
            <Badge variant="student">
              <Icons.IdCard className="h-3 w-3" />
              {membership.member_id}
            </Badge>
          ) : null}
        </div>

        {membership?.joined_at ? (
          <p className="text-xs text-muted-foreground">
            Se unio el {new Date(membership.joined_at).toLocaleDateString('es-PE', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        ) : null}

        {isPending ? (
          <MemberActionButtons
            userId={member.id}
            userName={member.name ?? member.email}
            currentState="pending"
          />
        ) : null}

        {isApproved ? (
          <MemberActionButtons
            userId={member.id}
            userName={member.name ?? member.email}
            currentState="approved"
          />
        ) : null}

        {isRejected ? (
          <MemberActionButtons
            userId={member.id}
            userName={member.name ?? member.email}
            currentState="rejected"
          />
        ) : null}

        {isAlumni ? (
          <p className="rounded-lg border bg-muted/40 p-3 text-left text-xs text-muted-foreground lg:text-right">
            Los registros alumni son de solo lectura en esta vista.
          </p>
        ) : null}
      </div>
    </article>
  )
}
