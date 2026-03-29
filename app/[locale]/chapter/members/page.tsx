import { requireUserWithRole } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import MemberCard from './components/member-card'
import { Users, AlertCircle } from 'lucide-react'
import { MembersTabs } from './components/member-tabs'
import type { MemberWithProfile } from '@/lib/types'
import { getChapterMembers, getMemberStats } from '@/lib/actions/chapter/get-data'

export type MemberFilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'incomplete'

export function filterMembers(
  members: MemberWithProfile[],
  status: MemberFilterStatus
): MemberWithProfile[] {
  switch (status) {
    case 'pending':
      return members.filter(
        m => m.StudentProfile?.isFilled && m.StudentProfile?.approvalStatus === 'pending'
      )
    case 'approved':
      return members.filter(
        m => m.StudentProfile?.approvalStatus === 'approved'
      )
    case 'rejected':
      return members.filter(
        m => m.StudentProfile?.approvalStatus === 'rejected'
      )
    case 'incomplete':
      return members.filter(m => !m.StudentProfile?.isFilled)
    default:
      return members
  }
}

export default async function ChapterMembersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: MemberFilterStatus }>
}) {
  const { status = 'all' } = await searchParams

  const validStatuses: MemberFilterStatus[] = ['all', 'pending', 'approved', 'rejected', 'incomplete']
  const safeStatus: MemberFilterStatus = validStatuses.includes(status) ? status : 'all'

  const { supabase, user } = await requireUserWithRole('editor')

  const { data: profile } = await supabase
    .from('StudentProfile')
    .select(`
      chapterId,
      Chapter (
        id,
        name,
        university
      )
    `)
    .eq('userId', user.id)
    .maybeSingle()

  if (!profile?.chapterId || !profile.Chapter) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card>
          <CardHeader className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <CardTitle>No Chapter Assigned</CardTitle>
              <CardDescription>
                You are not currently assigned to a chapter. Please contact an administrator.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const chapterId = profile.chapterId
  const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter

  const allMembers = await getChapterMembers(chapterId)
  const stats = getMemberStats(allMembers)
  const displayMembers = filterMembers(allMembers, safeStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chapter Members</h1>
        <p className="text-muted-foreground mt-2">
          Manage members from {chapter?.name ?? 'Unknown Chapter'}
        </p>
      </div>

      <MembersTabs currentStatus={safeStatus} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <div className="text-2xl font-bold text-warning">
              {stats.pending}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <div className="text-2xl font-bold text-success">
              {stats.approved}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incomplete
            </CardTitle>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.incomplete}
            </div>
          </CardHeader>
        </Card>
      </div>

      {displayMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 opacity-50" />
            <p className="text-muted-foreground mt-2">
              No members found in this category
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}