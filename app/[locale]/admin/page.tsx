import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  getAdminDashboardStats,
  getChapterActivityList,
  getRecentJoins,
  getPendingRecruiterRequests,
} from '@/lib/actions/admin/get-data'
import {
  Users,
  Building2,
  TrendingUp,
  CalendarDays,
  Mail,
} from 'lucide-react'

async function AdminStats() {
  const stats = await getAdminDashboardStats()

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_students}</div>
            <p className="text-xs text-muted-foreground">Members with student role</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chapters</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_chapters}</div>
            <p className="text-xs text-muted-foreground">Chapters with members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events_this_month}</div>
            <p className="text-xs text-muted-foreground">Events starting this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Visibility Opt-in Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recruiter_opt_in_rate}%</div>
            <p className="text-xs text-muted-foreground">Approved and visible to partner companies</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

async function AdminInsights() {
  const [chapterActivity, recentJoins, pendingRecruiterRequests] = await Promise.all([
    getChapterActivityList(),
    getRecentJoins(10),
    getPendingRecruiterRequests(),
  ])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Chapter Activity</CardTitle>
          <CardDescription>Member count, latest event, pending approvals</CardDescription>
        </CardHeader>
        <CardContent>
          {chapterActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chapter activity yet.</p>
          ) : (
            <div className="space-y-4">
              {chapterActivity.slice(0, 8).map((chapter) => (
                <div key={chapter.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{chapter.name}</p>
                    <p className="text-xs text-muted-foreground">{chapter.member_count} members • {chapter.pending_approvals} pending</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {chapter.last_event_at ? new Date(chapter.last_event_at).toLocaleDateString() : 'No events'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Joins</CardTitle>
          <CardDescription>Last 10 users that created accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJoins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent joins.</p>
          ) : (
            <div className="space-y-4">
              {recentJoins.map((join) => (
                <div key={join.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{join.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{join.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(join.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Company Access Invites</CardTitle>
          <CardDescription>Invites awaiting acceptance</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRecruiterRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending company access invites.</p>
          ) : (
            <div className="space-y-4">
              {pendingRecruiterRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{request.recruiter_email}</p>
                    <p className="text-xs text-muted-foreground truncate">{request.company_name ?? 'Unknown company'}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/invites">
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      Open
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-2">
          KPIs, chapter activity, recent joins, and company access invite queue.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdminStats />
      </Suspense>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdminInsights />
      </Suspense>
    </div>
  )
}
