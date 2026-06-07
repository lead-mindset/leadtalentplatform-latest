import { requireChapterMember } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { Icons } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import type { MemberWithProfile } from '@/lib/types'
import {
  getChapterEboardInvites,
  getChapterMemberPermissions,
  getChapterMembers,
  getMemberStats,
} from '@/lib/actions/chapter/get-data'
import type { ChapterMemberPermissionFlags } from '@/lib/services/chapter.service'
import { EboardInviteManagement } from './components/eboard-invite-management'
import { MembersList } from './components/members-list'
import { MembersTabs, type MemberStatusCounts } from './components/member-tabs'

export type MemberFilterStatus = 'pending' | 'active' | 'rejected' | 'inactive' | 'alumni'

export function filterMembers(members: MemberWithProfile[], status: MemberFilterStatus): MemberWithProfile[] {
  switch (status) {
    case 'pending':
      return members.filter(
        member => member.person_profile && member.chapter_membership?.status === 'pending'
      )
    case 'active':
      return members.filter(
        member => member.chapter_membership?.status === 'approved'
      )
    case 'rejected':
      return members.filter(
        member => member.chapter_membership?.status === 'rejected'
      )
    case 'inactive':
      return members.filter(
        member => member.chapter_membership?.status === 'inactive'
      )
    case 'alumni':
      return members.filter(
        member => member.chapter_membership?.status === 'alumni'
      )
  }
}

function getVisibleStatuses(permissions: ChapterMemberPermissionFlags): MemberFilterStatus[] {
  const statuses: MemberFilterStatus[] = []
  if (permissions.canManageApplications || permissions.canViewApplicants) statuses.push('pending')
  if (permissions.canViewApproved) statuses.push('active')
  if (permissions.canViewRejected) statuses.push('rejected')
  if (permissions.canViewInactive) statuses.push('inactive')
  if (permissions.canViewAlumni) statuses.push('alumni')
  return statuses
}

export default async function ChapterMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: MemberFilterStatus }>
}) {
  const { status } = await searchParams
  const { supabase, user, chapter_id } = await requireChapterMember()

  const { data: chapter } = await supabase
    .from('chapter')
    .select('id, name, university')
    .eq('id', chapter_id)
    .maybeSingle()

  if (!chapter) {
    return (
      <MainContainer className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Icons.AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-xl font-semibold">Sin capítulo asignado</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              No tienes un capítulo asignado. Contacta a una persona administradora.
            </p>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  const permissions = await getChapterMemberPermissions(chapter_id)
  if (!permissions) {
    return (
      <MainContainer className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Icons.AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-xl font-semibold">Sin permisos de miembros</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Tu rol de capítulo no tiene permisos para ver esta lista.
            </p>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  const allMembers = await getChapterMembers(chapter_id)
  const eboardInvites = permissions.canAssignEboard ? await getChapterEboardInvites(chapter_id) : []
  const stats = getMemberStats(allMembers)
  const counts: MemberStatusCounts = {
    pending: stats.pending,
    active: stats.approved,
    rejected: stats.rejected,
    inactive: stats.inactive,
    alumni: stats.alumni,
  }
  const visibleStatuses = getVisibleStatuses(permissions)
  const defaultStatus: MemberFilterStatus =
    visibleStatuses.includes('pending') && stats.pending > 0
      ? 'pending'
      : visibleStatuses.includes('active')
        ? 'active'
        : visibleStatuses[0] ?? 'active'
  const safeStatus: MemberFilterStatus =
    status && visibleStatuses.includes(status) ? status : defaultStatus
  const displayMembers = filterMembers(allMembers, safeStatus)

  return (
    <MainContainer className="py-8 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Resumen', href: '/chapter' },
          { label: 'Miembros' },
        ]}
      />

      <PageHeader
        eyebrow="Herramientas del capítulo"
        title="Miembros del capítulo"
        badge={<Badge variant="outline">{chapter.name}</Badge>}
      />

      <div className="space-y-4">
        {permissions.canAssignEboard ? (
          <EboardInviteManagement invites={eboardInvites} />
        ) : null}

        <MembersTabs currentStatus={safeStatus} counts={counts} visibleStatuses={visibleStatuses} />

        {displayMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icons.Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">No hay miembros en esta vista</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Cambia el filtro de estado para revisar otros registros de membresía.
              </p>
            </CardContent>
          </Card>
        ) : (
          <MembersList
            members={displayMembers}
            status={safeStatus}
            permissions={permissions}
            currentUserId={user.id}
          />
        )}
      </div>
    </MainContainer>
  )
}
