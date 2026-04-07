import { requireUserWithRole } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Users, AlertCircle } from 'lucide-react'
import { MembersTabs } from './components/member-tabs'
import type { MemberWithProfile } from '@/lib/types'
import { getChapterMembers, getMemberStats } from '@/lib/actions/chapter/get-data'
import { MembersList } from './components/members-list'

export type MemberFilterStatus = 'pending' | 'active' | 'rejected'

export function filterMembers(members: MemberWithProfile[], status: MemberFilterStatus): MemberWithProfile[] {
  switch (status) {
    case 'pending':
      return members.filter(
        m => m.StudentProfile?.isFilled && m.StudentProfile?.approvalStatus === 'pending'
      )
    case 'active':
      return members.filter(
        m => m.StudentProfile?.approvalStatus === 'approved'
      )
    case 'rejected':
      return members.filter(
        m => m.StudentProfile?.approvalStatus === 'rejected'
      )
  }
}

export default async function ChapterMembersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: MemberFilterStatus }>
}) {
  const { status } = await searchParams

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
  const allMembers = await getChapterMembers(chapterId)
  const stats = getMemberStats(allMembers)
  const validStatuses: MemberFilterStatus[] = ['pending', 'active', 'rejected']
  const defaultStatus: MemberFilterStatus = stats.pending > 0 ? 'pending' : 'active'
  const safeStatus: MemberFilterStatus = status && validStatuses.includes(status) ? status : defaultStatus
  const displayMembers = filterMembers(allMembers, safeStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chapter Members</h1>
        <p className="text-muted-foreground mt-2">
          Review pending approvals and manage your member roster.
        </p>
      </div>

      <MembersTabs currentStatus={safeStatus} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <div className="text-2xl font-bold">{stats.total}</div>
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
        <MembersList members={displayMembers} currentUserId={user.id} status={safeStatus} />
      )}
    </div>
  )
}