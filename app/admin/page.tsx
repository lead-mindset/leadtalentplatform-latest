import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Suspense } from 'react'
import { 
  Users, 
  Building2,
  Building,
  Mail,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  ArrowUpRight
} from 'lucide-react'

async function getSystemStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalChapters },
    { count: totalCompanies },
    { count: totalProfiles },
    { count: completeProfiles },
    { count: visibleProfiles },
    { count: pendingApprovals },
    { count: activeRecruiters },
    { count: pendingInvites }
  ] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Chapter').select('*', { count: 'exact', head: true }),
    supabase.from('Company').select('*', { count: 'exact', head: true }),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }).eq('isFilled', true),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }).eq('isRecruiterVisible', true),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }).is('approvedById', null).eq('isFilled', true),
    supabase.from('RecruiterAccess').select('*', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('RecruiterAccess').select('*', { count: 'exact', head: true }).is('acceptedAt', null).is('revokedAt', null).gt('inviteExpiresAt', new Date().toISOString())
  ])

  const completionRate = totalProfiles && totalProfiles > 0 
    ? Math.round(((completeProfiles || 0) / totalProfiles) * 100)
    : 0

  return {
    totalUsers: totalUsers || 0,
    totalChapters: totalChapters || 0,
    totalCompanies: totalCompanies || 0,
    totalProfiles: totalProfiles || 0,
    completeProfiles: completeProfiles || 0,
    visibleProfiles: visibleProfiles || 0,
    pendingApprovals: pendingApprovals || 0,
    activeRecruiters: activeRecruiters || 0,
    pendingInvites: pendingInvites || 0,
    completionRate
  }
}

async function getRecentActivity() {
  const supabase = await createClient()

  // Get recently approved profiles - specify the userId relationship
  const { data: recentApprovals } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      updatedAt,
      User!StudentProfile_userId_fkey (
        name,
        email,
        chapterId,
        Chapter (name)
      ),
      ApprovedBy:User!StudentProfile_approvedById_fkey (
        name
      )
    `)
    .not('approvedById', 'is', null)
    .order('updatedAt', { ascending: false })
    .limit(5)

  // Get recently accepted invites
  const { data: recentInvites } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      acceptedAt,
      recruiterEmail,
      Company (name),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name
      )
    `)
    .not('acceptedAt', 'is', null)
    .order('acceptedAt', { ascending: false })
    .limit(5)

  return {
    recentApprovals: recentApprovals || [],
    recentInvites: recentInvites || []
  }
}

async function AdminStats() {
  const stats = await getSystemStats()

  return (
    <>
      {(stats.pendingApprovals > 0 || stats.pendingInvites > 0) && (
        <div className="space-y-4">
          {stats.pendingApprovals > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <CardTitle className="text-orange-900 dark:text-orange-100">
                        Pending Profile Approvals
                      </CardTitle>
                      <CardDescription className="text-orange-700 dark:text-orange-300">
                        {stats.pendingApprovals} {stats.pendingApprovals === 1 ? 'student needs' : 'students need'} chapter approval
                      </CardDescription>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/admin/users?filter=pending">
                      Review Users
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {stats.pendingInvites > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <CardTitle className="text-blue-900 dark:text-blue-100">
                        Pending Invites
                      </CardTitle>
                      <CardDescription className="text-blue-700 dark:text-blue-300">
                        {stats.pendingInvites} {stats.pendingInvites === 1 ? 'recruiter invite is' : 'recruiter invites are'} pending
                      </CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/admin/invites">
                      View Invites
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completeProfiles} complete profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChapters}</div>
            <p className="text-xs text-muted-foreground">Active chapters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeRecruiters} active recruiters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible Profiles</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visibleProfiles}</div>
            <p className="text-xs text-muted-foreground">
              Recruiter-visible students
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/chapters">
              <Building2 className="h-5 w-5 mb-2 text-blue-500" />
              <span className="font-semibold">Manage Chapters</span>
              <span className="text-xs text-muted-foreground">{stats.totalChapters} chapters</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/companies">
              <Building className="h-5 w-5 mb-2 text-purple-500" />
              <span className="font-semibold">Manage Companies</span>
              <span className="text-xs text-muted-foreground">{stats.totalCompanies} companies</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/users">
              <Users className="h-5 w-5 mb-2 text-green-500" />
              <span className="font-semibold">Manage Users</span>
              <span className="text-xs text-muted-foreground">{stats.totalUsers} users</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/invites">
              <Mail className="h-5 w-5 mb-2 text-orange-500" />
              <span className="font-semibold">Manage Invites</span>
              <span className="text-xs text-muted-foreground">
                {stats.pendingInvites} pending
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Platform-wide metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion Rate</span>
              <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completeProfiles} of {stats.totalProfiles} profiles complete
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Active Recruiters</p>
              <p className="text-2xl font-bold">{stats.activeRecruiters}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

async function RecentActivity() {
  const { recentApprovals, recentInvites } = await getRecentActivity()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Approvals</CardTitle>
              <CardDescription>Latest student profile approvals</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {recentApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApprovals.map((approval: any) => (
                <div 
                  key={approval.userId}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {approval.User?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {approval.User?.Chapter?.name || 'No chapter'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(approval.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <Button asChild variant="ghost" className="w-full">
              <Link href="/admin/activity">
                View All Activity <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Invites</CardTitle>
              <CardDescription>Latest recruiter acceptances</CardDescription>
            </div>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {recentInvites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent invites</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvites.map((invite: any) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {invite.recruiterEmail}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {invite.Company?.name || 'Unknown company'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs text-muted-foreground">
                      {invite.acceptedAt && new Date(invite.acceptedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <Button asChild variant="ghost" className="w-full">
              <Link href="/admin/invites">
                View All Invites <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
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
          System-wide statistics and recent activity
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdminStats />
      </Suspense>

      <Suspense fallback={<LoadingSkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}