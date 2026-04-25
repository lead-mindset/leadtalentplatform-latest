import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Suspense } from 'react'
import { Icons } from '@/components/ui/icons'
import { requireChapterMember } from '@/lib/auth'
import type { MemberWithProfile, RecentActivityMember } from '@/lib/types'
import { getChapterMembers, getMemberStats, getRecentChapterActivity } from '@/lib/actions/chapter/get-data'
import { getChapterEvents } from '@/lib/actions/events/get-data'
import MemberCard from './members/components/member-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  variant = 'default',
}: {
  label: string
  value: number
  sub?: string
  icon: React.ElementType
  variant?: 'default' | 'warning' | 'success' | 'info'
}) {
  const iconClass =
    variant === 'warning'
      ? 'text-warning'
      : variant === 'success'
      ? 'text-success'
      : variant === 'info'
      ? 'text-info'
      : 'text-muted-foreground'

  const valueClass =
    variant === 'warning'
      ? 'text-warning'
      : variant === 'success'
      ? 'text-success'
      : 'text-foreground'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function PendingInbox({
  members,
  currentUserId,
  total,
}: {
  members: MemberWithProfile[]
  currentUserId: string
  total: number
}) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <Icons.CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="font-medium text-foreground">All caught up</p>
          <p className="text-sm text-muted-foreground mt-1">
            No members waiting for approval
          </p>
        </CardContent>
      </Card>
    )
  }

  const preview = members.slice(0, 3)
  const remaining = total - preview.length

  return (
    <div className="space-y-3">
      {preview.map(member => (
        <MemberCard
          key={member.id}
          member={member}
          currentUserId={currentUserId}
        />
      ))}
      {remaining > 0 && (
        <Button asChild variant="outline" className="w-full">
          <Link href="/chapter/members?status=pending">
            View {remaining} more pending member{remaining > 1 ? 's' : ''}
            <Icons.ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}

function RecentApprovals({ members }: { members: RecentActivityMember[] }) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Approved members will appear here
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {members.map(member => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-md px-2 py-2.5 hover:bg-accent transition-colors"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{member.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {member.StudentProfile.major}
            </p>
          </div>
          <p className="text-xs text-muted-foreground ml-3 shrink-0">
            {new Date(member.StudentProfile.updated_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      ))}
    </div>
  )
}

function QuickLinks({
  pendingCount,
}: {
  pendingCount: number
}) {
  const links = [
    { label: 'Create Event', href: '/chapter/events/new' },
    { label: 'Manage Members', href: `/chapter/members?status=${pendingCount > 0 ? 'pending' : 'active'}` },
    { label: 'Open Check-in', href: '/chapter/checkin' },
  ]

  return (
    <div className="space-y-0.5">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors group"
        >
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">{link.label}</span>
          <Icons.ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      ))}
    </div>
  )
}

function EventOpsList({
  events,
}: {
  events: Awaited<ReturnType<typeof getChapterEvents>>
}) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No upcoming chapter events yet. Create your first one to start registrations.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {events.slice(0, 4).map((event) => {
        const capacity = event.capacity
        const registrations = event._count.registrations
        const percentage = capacity && capacity > 0
          ? Math.min(100, Math.round((registrations / capacity) * 100))
          : null

        return (
          <Card key={event.id}>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.start_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/chapter/events/${event.id}/checkin`}>Check-in</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {capacity === null
                  ? `${registrations} registered`
                  : `${registrations} / ${capacity} registered`}
              </p>
              {percentage !== null && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

async function ChapterContent() {
  const { supabase, user, chapterId } = await requireChapterMember()

  const { data: profileData } = await supabase
    .from('student_profile')
    .select(`
      chapter_id,
      Chapter:chapter_id ( id, name, university )
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profileData?.Chapter) {
    return (
      <Card className="max-w-md mx-auto mt-20">
        <CardHeader>
          <CardTitle>No Chapter Assigned</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are not assigned to a chapter. Please contact an administrator.
          </p>
        </CardContent>
      </Card>
    )
  }

  const chapter = Array.isArray(profileData.Chapter)
    ? profileData.Chapter[0]
    : profileData.Chapter

  const [allMembers, recentActivity, chapterEvents] = await Promise.all([
    getChapterMembers(chapterId),
    getRecentChapterActivity(chapterId, 4),
    getChapterEvents(),
  ])

  const stats = getMemberStats(allMembers)
  const approvalRate =
    stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

  const pendingMembers = allMembers.filter(
    m => m.StudentProfile?.is_filled && m.StudentProfile?.approval_status === 'pending'
  )
  const upcomingEventsCount = chapterEvents.filter((event) => new Date(event.end_at) >= new Date()).length

  return (
    <MainContainer className="py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: 'Dashboard', href: '/chapter' }]} />

      {/* Page Header with Clear Hierarchy */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Chapter Overview</h1>
        <p className="text-muted-foreground text-lg">
          {chapter?.name} - {chapter?.university}
        </p>
      </div>

      {stats.total === 0 && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="font-medium">Your chapter doesn&apos;t have members yet.</p>
            <p className="text-sm text-muted-foreground">
              Share your chapter signup guidance so students can complete onboarding and appear here.
            </p>
            <Button asChild variant="outline">
              <Link href="/chapter/members">Manage Members</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Members"
          value={stats.total}
          sub="In your chapter"
          icon={Icons.Users}
        />
        <StatCard
          label="Pending Approval"
          value={stats.pending}
          sub="Need your review"
          icon={Icons.Clock}
          variant="warning"
        />
        <StatCard
          label="Upcoming Events"
          value={upcomingEventsCount}
          sub="Open for chapter operations"
          icon={Icons.UserCheck}
          variant="success"
        />
        <StatCard
          label="Approval Rate"
          value={approvalRate}
          sub="Approved members percentage"
          icon={Icons.TrendingUp}
          variant="info"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {stats.pending > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Pending Approvals</h2>
                  <p className="text-sm text-muted-foreground">
                    {stats.pending} member{stats.pending > 1 ? 's' : ''} waiting for your decision
                  </p>
                </div>
                {stats.pending > 3 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/chapter/members?status=pending">
                      <span className="flex items-center">
                        View all
                        <Icons.ChevronRight className="ml-1 h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                )}
              </div>

              <PendingInbox
                members={pendingMembers}
                currentUserId={user.id}
                total={stats.pending}
              />
            </>
          )}

          <div className="space-y-2">
            <h2 className="text-base font-semibold">Upcoming Events</h2>
            <p className="text-sm text-muted-foreground">Track registration volume ahead of event day.</p>
          </div>
          <EventOpsList events={chapterEvents.filter((event) => new Date(event.end_at) >= new Date())} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Approvals</CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                  <Link href="/chapter/members?status=approved">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <RecentApprovals members={recentActivity as RecentActivityMember[]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickLinks pendingCount={stats.pending} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainContainer>
  )
}

function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-52 bg-muted rounded-md" />
        <div className="h-4 w-72 bg-muted rounded-md mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted rounded mb-2" />
              <div className="h-3 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-36 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><div className="h-4 w-28 bg-muted rounded" /></CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ChapterOverviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChapterContent />
    </Suspense>
  )
}