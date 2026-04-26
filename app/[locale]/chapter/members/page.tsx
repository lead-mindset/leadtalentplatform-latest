import { requireChapterMember } from '@/lib/auth'
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
import { Breadcrumb } from '@/components/ui/breadcrumb'

export type MemberFilterStatus = 'pending' | 'active' | 'rejected'

export function filterMembers(members: MemberWithProfile[], status: MemberFilterStatus): MemberWithProfile[] {
  switch (status) {
    case 'pending':
      return members.filter(
        m => m.student_profile?.is_filled && m.student_profile?.approval_status === 'pending'
      )
    case 'active':
      return members.filter(
        m => m.student_profile?.approval_status === 'approved'
      )
    case 'rejected':
      return members.filter(
        m => m.student_profile?.approval_status === 'rejected'
      )
  }
}

export default async function ChapterMembersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: MemberFilterStatus }>
}) {
  const { status } = await searchParams

  const { supabase, user, chapter_id } = await requireChapterMember()

  const { data: profile } = await supabase
    .from('student_profile')
    .select(`
      Chapter (
        id,
        name,
        university
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.chapter) {
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

  const allMembers = await getChapterMembers(chapter_id)
  const stats = getMemberStats(allMembers)
  const validStatuses: MemberFilterStatus[] = ['pending', 'active', 'rejected']
  const defaultStatus: MemberFilterStatus = stats.pending > 0 ? 'pending' : 'active'
  const safeStatus: MemberFilterStatus = status && validStatuses.includes(status) ? status : defaultStatus
  const displayMembers = filterMembers(allMembers, safeStatus)

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/chapter' },
        { label: 'Members' }
      ]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Chapter Members</h1>
        <p className="text-muted-foreground text-lg">
          Review pending approvals and manage your member roster
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
