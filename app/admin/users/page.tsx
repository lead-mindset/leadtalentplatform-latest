import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Suspense } from 'react'
import { Users, Mail, Building2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { UserWithDetails } from '@/lib/types'
import { getUsers } from '@/lib/actions/admin/get-data'



function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'editor':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'recruiter':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

function getProfileStatus(user: UserWithDetails) {
  if (!user.StudentProfile) {
    return { icon: XCircle, label: 'No Profile', color: 'text-gray-400' }
  }
  if (!user.StudentProfile.isFilled) {
    return { icon: Clock, label: 'Incomplete', color: 'text-orange-500' }
  }
  if (!user.StudentProfile.approvedById) {
    return { icon: Clock, label: 'Pending', color: 'text-orange-500' }
  }
  if (user.StudentProfile.isRecruiterVisible) {
    return { icon: CheckCircle2, label: 'Visible', color: 'text-green-500' }
  }
  return { icon: CheckCircle2, label: 'Approved', color: 'text-blue-500' }
}

async function UsersTable() {
  const users = await getUsers()

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    editors: users.filter(u => u.role === 'editor').length,
    members: users.filter(u => u.role === 'member').length,
    recruiters: users.filter(u => u.role === 'recruiter').length,
    pending: users.filter(u => u.StudentProfile?.isFilled && !u.StudentProfile?.approvedById).length,
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.editors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Chapter</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Joined</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const status = getProfileStatus(user)
                    const StatusIcon = status.icon

                    return (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{user.name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {user.Chapter ? (
                            <div className="flex items-start gap-2">
                              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium">{user.Chapter.name}</p>
                                <p className="text-muted-foreground">{user.Chapter.university}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {user.role === 'member' ? 'No chapter assigned' : '—'}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            <span className="text-sm">{status.label}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/users/${user.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <UsersTable />
      </Suspense>
    </div>
  )
}