import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Suspense } from 'react'
import { Users, Building2, CheckCircle2, Clock, XCircle, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react'
import type { UserWithDetails } from '@/lib/types'
import { getUsers } from '@/lib/actions/admin/get-data'
import { UserTabs } from './user-tabs'
import { getRoleColor } from '@/lib/options'

type UserRole = 'all' | 'members' | 'editors' | 'recruiters' | 'admins'

function getProfileStatus(user: UserWithDetails) {
  if (!user.StudentProfile) {
    return {
      icon: XCircle,
      label: 'No Profile',
      color: 'text-muted-foreground'
    }
  }
  if (!user.StudentProfile.isFilled) {
    return {
      icon: Clock,
      label: 'Incomplete',
      color: 'text-chart-4'
    }
  }

  switch (user.StudentProfile.approvalStatus) {
    case 'approved':
      return user.StudentProfile.isRecruiterVisible
        ? { icon: CheckCircle2, label: 'Visible', color: 'text-chart-1' }
        : { icon: CheckCircle2, label: 'Approved', color: 'text-chart-1' }
    case 'rejected':
      return { icon: XCircle, label: 'Rejected', color: 'text-destructive' }
    case 'pending':
    default:
      return { icon: AlertCircle, label: 'Pending', color: 'text-chart-4' }
  }
}

function filterUsersByRole(users: UserWithDetails[], role: UserRole): UserWithDetails[] {
  if (role === 'all') return users

  if (role === 'members') {
    return users.filter(u => u.role === 'member' || u.role === 'editor')
  }

  const roleMap: Record<string, string> = {
    'editors': 'editor',
    'recruiters': 'recruiter',
    'admins': 'admin'
  }

  const targetRole = roleMap[role] || role
  return users.filter(u => u.role === targetRole)
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

async function UsersTable({ role }: { role: UserRole }) {
  const allUsers = await getUsers()
  const users = filterUsersByRole(allUsers, role)

  const stats = {
    total: allUsers.length,
    admins: allUsers.filter(u => u.role === 'admin').length,
    editors: allUsers.filter(u => u.role === 'editor').length,
    members: allUsers.filter(u => u.role === 'member' || u.role === 'editor').length,
    recruiters: allUsers.filter(u => u.role === 'recruiter').length,
    pending: allUsers.filter(u => u.StudentProfile?.isFilled && !u.StudentProfile?.approvedById).length,
    visible: allUsers.filter(u => u.StudentProfile?.isRecruiterVisible).length,
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{stats.total}</div>
              <TrendingUp className="h-4 w-4 text-chart-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across all roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.members}</div>
            <p className="text-xs text-muted-foreground mt-2">Students & editors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recruiters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.recruiters}</div>
            <p className="text-xs text-muted-foreground mt-2">Company representatives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{stats.pending}</div>
              {stats.pending > 0 && <AlertCircle className="h-4 w-4 text-chart-4" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.visible} visible to recruiters
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {role === 'all' && 'All Users'}
                {role === 'members' && 'Members'}
                {role === 'editors' && 'Editors'}
                {role === 'recruiters' && 'Company Representatives'}
                {role === 'admins' && 'Administrators'}
              </CardTitle>
              <CardDescription className="mt-1">
                {users.length} {users.length === 1 ? 'user' : 'users'} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground">
                There are no users in this category yet.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => {
                const status = getProfileStatus(user)
                const StatusIcon = status.icon

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">
                          {user.name || 'No name'}
                        </p>
                        <Badge className={getRoleColor(user.role)} variant="outline">
                          {user.role}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="truncate">{user.email}</span>
                        {user.Chapter && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <div className="hidden sm:flex items-center gap-1.5 truncate">
                              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{user.Chapter.name}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/users/${user.id}`} className="gap-1">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-9 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-7 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ role?: UserRole }>
}) {
  const { role = 'all' } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <Separator />

      <UserTabs currentRole={role} />

      <Suspense fallback={<LoadingSkeleton />}>
        <UsersTable role={role} />
      </Suspense>
    </div>
  )
}