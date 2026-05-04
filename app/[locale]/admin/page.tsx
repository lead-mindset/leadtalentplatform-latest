import Link from 'next/link'
import type { ElementType } from 'react'
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getAdminDashboardStats,
  getChapterActivityList,
  getPendingRecruiterRequests,
  getRecentJoins,
  getSystemStats,
} from '@/lib/actions/admin/get-data'

function formatDate(value: string | null) {
  if (!value) return 'No activity'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No activity'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function StatTile({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: number | string
  helper: string
  icon: ElementType
  tone?: 'neutral' | 'attention' | 'success'
}) {
  const toneClass =
    tone === 'attention'
      ? 'bg-warning/10 text-warning'
      : tone === 'success'
        ? 'bg-success/10 text-success'
        : 'bg-muted text-muted-foreground'

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function QueueRow({
  label,
  value,
  href,
  helper,
}: {
  label: string
  value: number
  href: string
  helper: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={value > 0 ? 'warning' : 'success'}>{value}</Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

function ManagementLink({
  label,
  href,
  helper,
  icon: Icon,
}: {
  label: string
  href: string
  helper: string
  icon: ElementType
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="truncate text-sm text-muted-foreground">{helper}</p>
      </div>
    </Link>
  )
}

export default async function AdminOverviewPage() {
  const [
    dashboardStats,
    systemStats,
    chapterActivity,
    recentJoins,
    pendingCompanyInvites,
  ] = await Promise.all([
    getAdminDashboardStats(),
    getSystemStats(),
    getChapterActivityList(),
    getRecentJoins(8),
    getPendingRecruiterRequests(),
  ])

  const pendingChapterApprovals = chapterActivity.reduce(
    (total, chapter) => total + chapter.pending_approvals,
    0
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
            <Badge variant={pendingChapterApprovals + systemStats.pending_invites > 0 ? 'warning' : 'success'}>
              {pendingChapterApprovals + systemStats.pending_invites > 0 ? 'Needs review' : 'Clear'}
            </Badge>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Monitor operational queues, platform coverage, and management entry points.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/activity">Activity</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/invites">Review invites</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <StatTile
          label="Users"
          value={systemStats.total_users}
          helper="Accounts in the platform"
          icon={Users}
        />
        <StatTile
          label="Chapters"
          value={systemStats.total_chapters}
          helper={`${dashboardStats.active_chapters} with members`}
          icon={Building2}
        />
        <StatTile
          label="Companies"
          value={systemStats.total_companies}
          helper="Organizations in admin"
          icon={Building2}
        />
        <StatTile
          label="Events"
          value={dashboardStats.events_this_month}
          helper="Starting this month"
          icon={CalendarDays}
        />
        <StatTile
          label="Pending approvals"
          value={pendingChapterApprovals}
          helper="Chapter applications"
          icon={Clock}
          tone={pendingChapterApprovals > 0 ? 'attention' : 'success'}
        />
        <StatTile
          label="Company visibility"
          value={`${dashboardStats.recruiter_opt_in_rate}%`}
          helper="Approved visible profiles"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Priority Queue</CardTitle>
            <CardDescription>Items that need admin or chapter follow-up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QueueRow
              label="Company access invites"
              value={systemStats.pending_invites}
              href="/admin/invites"
              helper="Sent but not accepted or revoked"
            />
            <QueueRow
              label="Chapter approvals"
              value={pendingChapterApprovals}
              href="/admin/chapters"
              helper="Pending chapter membership applications"
            />
            <QueueRow
              label="Profiles visible to companies"
              value={systemStats.visibleProfiles}
              href="/admin/users"
              helper="Recruitable approved profiles"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chapter Activity</CardTitle>
            <CardDescription>Membership size, open approvals, and latest event activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {chapterActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chapter activity yet.</p>
            ) : (
              <div className="divide-y">
                {chapterActivity.slice(0, 8).map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{chapter.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {chapter.member_count} members · {chapter.pending_approvals} pending
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">{formatDate(chapter.last_event_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>Common admin destinations, kept close without adding extra navigation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ManagementLink label="Users" href="/admin/users" helper="Roles, profiles, approvals" icon={Users} />
            <ManagementLink label="Chapters" href="/admin/chapters" helper="Metadata and editors" icon={Building2} />
            <ManagementLink label="Companies" href="/admin/companies" helper="Organizations and access" icon={Building2} />
            <ManagementLink label="Events" href="/admin/events" helper="Platform event oversight" icon={CalendarDays} />
            <ManagementLink label="Invites" href="/admin/invites" helper="Company access queue" icon={Mail} />
            <ManagementLink label="Activity" href="/admin/activity" helper="Recent admin changes" icon={Activity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Joins</CardTitle>
            <CardDescription>Latest accounts created.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJoins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent joins.</p>
            ) : (
              <div className="divide-y">
                {recentJoins.map((join) => (
                  <div key={join.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{join.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{join.email}</p>
                      </div>
                      <Badge variant="outline">{join.role}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {join.chapter_name ?? 'No chapter'} · {formatDate(join.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {pendingCompanyInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Company Access</CardTitle>
            <CardDescription>Most recent company representatives waiting to accept access.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {pendingCompanyInvites.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{request.recruiter_email}</p>
                  <p className="truncate text-sm text-muted-foreground">{request.company_name ?? 'Unknown company'}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/invites">Open</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
