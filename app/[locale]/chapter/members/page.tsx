import { requireChapterMember } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import type { MemberWithProfile } from '@/lib/types'
import { getChapterMembers, getMemberStats } from '@/lib/actions/chapter/get-data'
import { MembersList } from './components/members-list'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { MembersTabs, type MemberStatusCounts } from './components/member-tabs'

export type MemberFilterStatus = 'pending' | 'active' | 'rejected' | 'alumni'

function alumniCount(members: MemberWithProfile[]) {
  return members.filter(member => member.chapter_membership?.status === 'alumni').length
}

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
    case 'alumni':
      return members.filter(
        member => member.chapter_membership?.status === 'alumni'
      )
  }
}

function SummaryBlock({
  label,
  value,
  helper,
  variant = 'default',
}: {
  label: string
  value: number
  helper: string
  variant?: 'default' | 'warning' | 'success' | 'destructive' | 'neutral'
}) {
  const valueClass =
    variant === 'warning'
      ? 'text-warning'
      : variant === 'success'
      ? 'text-success'
      : variant === 'destructive'
      ? 'text-destructive'
      : variant === 'neutral'
      ? 'text-muted-foreground'
      : 'text-foreground'

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

export default async function ChapterMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: MemberFilterStatus }>
}) {
  const { status } = await searchParams
  const { supabase, chapter_id } = await requireChapterMember()

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
            <h1 className="text-xl font-semibold">No chapter assigned</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              You are not currently assigned to a chapter. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  const allMembers = await getChapterMembers(chapter_id)
  const stats = getMemberStats(allMembers)
  const alumni = alumniCount(allMembers)
  const counts: MemberStatusCounts = {
    pending: stats.pending,
    active: stats.approved,
    rejected: stats.rejected,
    alumni,
  }
  const validStatuses: MemberFilterStatus[] = ['pending', 'active', 'rejected', 'alumni']
  const defaultStatus: MemberFilterStatus = stats.pending > 0 ? 'pending' : 'active'
  const safeStatus: MemberFilterStatus = status && validStatuses.includes(status) ? status : defaultStatus
  const displayMembers = filterMembers(allMembers, safeStatus)

  return (
    <MainContainer className="py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/chapter' },
          { label: 'Members' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Chapter Members</h1>
            <Badge variant="outline">{chapter.name}</Badge>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Review pending applicants and manage membership status for {chapter.university}.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryBlock
          label="Pending"
          value={stats.pending}
          helper="Need editor review"
          variant="warning"
        />
        <SummaryBlock
          label="Approved"
          value={stats.approved}
          helper="Active chapter members"
          variant="success"
        />
        <SummaryBlock
          label="Rejected"
          value={stats.rejected}
          helper="Declined applications"
          variant="destructive"
        />
        <SummaryBlock
          label="Alumni"
          value={alumni}
          helper="Former members"
          variant="neutral"
        />
        <SummaryBlock
          label="Total"
          value={stats.total}
          helper="All roster records"
        />
      </div>

      <div className="space-y-4">
        <MembersTabs currentStatus={safeStatus} counts={counts} />

        {displayMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icons.Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">No members in this view</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Switch status filters to review other chapter membership records.
              </p>
            </CardContent>
          </Card>
        ) : (
          <MembersList members={displayMembers} status={safeStatus} />
        )}
      </div>
    </MainContainer>
  )
}
