// app/chapter/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  UserX
} from 'lucide-react'

async function getChapterMembers(chapterId: string, status?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = new URL(`/api/chapters/${chapterId}/members`, baseUrl)
  if (status) {
    url.searchParams.set('status', status)
  }

  const res = await fetch(url.toString(), {
    cache: 'no-store', // This prevents caching
    next: { revalidate: 0 }, // Always fetch fresh data
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch members: ${res.statusText}`)
  }

  return res.json()
}

export default async function ChapterOverviewPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user data
  const { data: userData } = await supabase
    .from('User')
    .select('role, chapterId, Chapter(name, university)')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'editor') {
    redirect('/student')
  }

  if (!userData.chapterId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Chapter Assigned</CardTitle>
            <CardDescription>
              You are not currently assigned to a chapter. Please contact an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch members using API
  let allMembers: any[] = []
  let pendingMembers: any[] = []
  let approvedMembers: any[] = []

  try {
    const [allData, pendingData, approvedData] = await Promise.all([
      getChapterMembers(userData.chapterId, 'all'),
      getChapterMembers(userData.chapterId, 'pending'),
      getChapterMembers(userData.chapterId, 'approved'),
    ])

    allMembers = allData.members || []
    pendingMembers = pendingData.members || []
    approvedMembers = approvedData.members || []
  } catch (error) {
    console.error('Error fetching chapter data:', error)
    // Continue with empty arrays
  }

  // Calculate statistics
  const totalMembers = allMembers.length
  const pendingCount = pendingMembers.length
  const approvedCount = approvedMembers.length

  const completeProfiles = allMembers.filter(
    m => m.StudentProfile?.[0]?.isFilled === true
  ).length

  const visibleToRecruiters = allMembers.filter(
    m => m.StudentProfile?.[0]?.isRecruiterVisible === true
  ).length

  const completionRate = totalMembers 
    ? Math.round((completeProfiles / totalMembers) * 100)
    : 0

  const approvalRate = totalMembers
    ? Math.round((approvedCount / totalMembers) * 100)
    : 0

  // Get recent activity
  const recentActivity = approvedMembers
    .filter(m => m.StudentProfile?.[0]?.approvedById)
    .sort((a, b) => {
      const dateA = new Date(a.StudentProfile[0].updatedAt).getTime()
      const dateB = new Date(b.StudentProfile[0].updatedAt).getTime()
      return dateB - dateA
    })
    .slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chapter Overview</h1>
        <p className="text-muted-foreground mt-2">
          {userData.Chapter?.name} - {userData.Chapter?.university}
        </p>
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <CardTitle className="text-orange-900 dark:text-orange-100">
                    Pending Approvals
                  </CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    {pendingCount} {pendingCount === 1 ? 'member is' : 'members are'} waiting for approval
                  </CardDescription>
                </div>
              </div>
              <Button asChild>
                <Link href="/chapter/members?status=pending">
                  Review Members
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              In your chapter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Members</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              {approvalRate}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible to Recruiters</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visibleToRecruiters}</div>
            <p className="text-xs text-muted-foreground">
              Active profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common chapter management tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/chapter/members?status=pending">
              <Clock className="h-5 w-5 mb-2 text-orange-500" />
              <span className="font-semibold">Review Pending</span>
              <span className="text-xs text-muted-foreground">
                {pendingCount} members waiting
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/chapter/members?status=approved">
              <CheckCircle2 className="h-5 w-5 mb-2 text-green-500" />
              <span className="font-semibold">View Approved</span>
              <span className="text-xs text-muted-foreground">
                {approvedCount} approved members
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/chapter/members">
              <Users className="h-5 w-5 mb-2 text-blue-500" />
              <span className="font-semibold">All Members</span>
              <span className="text-xs text-muted-foreground">
                View complete roster
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest member approvals in your chapter</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Approved members will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((member: any) => {
                const profile = member.StudentProfile?.[0]
                return (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {profile?.updatedAt 
                          ? new Date(profile.updatedAt).toLocaleDateString()
                          : 'Unknown date'
                        }
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {recentActivity.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button asChild variant="ghost" className="w-full">
                <Link href="/chapter/activity">
                  View Full Activity Log
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter Health</CardTitle>
          <CardDescription>Overall profile completion metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-muted-foreground">{completionRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completeProfiles} of {totalMembers} members have complete profiles
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Approval Rate</span>
              <span className="text-sm text-muted-foreground">{approvalRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${approvalRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedCount} of {totalMembers} members approved
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}