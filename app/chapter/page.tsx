import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Suspense } from 'react'
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  UserX
} from 'lucide-react'
import { getChapterData } from '@/lib/chapter-actions'
import type { ChapterData } from '@/lib/types'

function StatsDisplay({ data }: { data: ChapterData }) {
  const { stats, pendingMembers, recentActivity, chapterName, university } = data

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chapter Overview</h1>
        <p className="text-muted-foreground mt-2">
          {chapterName} - {university}
        </p>
      </div>

      {stats.pendingCount > 0 && (
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
                    {stats.pendingCount} {stats.pendingCount === 1 ? 'member is' : 'members are'} waiting for approval
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">In your chapter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Members</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
            <p className="text-xs text-muted-foreground">{stats.approvalRate}% approval rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible to Recruiters</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visibleToRecruiters}</div>
            <p className="text-xs text-muted-foreground">Active profiles</p>
          </CardContent>
        </Card>
      </div>

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
              <span className="text-xs text-muted-foreground">{stats.pendingCount} members waiting</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/chapter/members?status=approved">
              <CheckCircle2 className="h-5 w-5 mb-2 text-green-500" />
              <span className="font-semibold">View Approved</span>
              <span className="text-xs text-muted-foreground">{stats.approvedCount} approved members</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/chapter/members">
              <Users className="h-5 w-5 mb-2 text-blue-500" />
              <span className="font-semibold">All Members</span>
              <span className="text-xs text-muted-foreground">View complete roster</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

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
              {recentActivity.map((member) => {
                const profile = member.StudentProfile
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
                        {new Date(profile.updatedAt).toLocaleDateString()}
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

      <Card>
        <CardHeader>
          <CardTitle>Chapter Health</CardTitle>
          <CardDescription>Overall profile completion metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completeProfiles} of {stats.totalMembers} members have complete profiles
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Approval Rate</span>
              <span className="text-sm text-muted-foreground">{stats.approvalRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${stats.approvalRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.approvedCount} of {stats.totalMembers} members approved
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function StatsLoading() {
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

async function ChapterContent() {
  const data = await getChapterData()

  if (!data) {
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

  return <StatsDisplay data={data} />
}

export default function ChapterOverviewPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<StatsLoading />}>
        <ChapterContent />
      </Suspense>
    </div>
  )
}