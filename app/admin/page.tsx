'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Building2, GraduationCap, Mail } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalChapters: number
  totalCompanies: number
  pendingInvites: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalChapters: 0,
    totalCompanies: 0,
    pendingInvites: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, chaptersRes, companiesRes, invitesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/chapters'),
          fetch('/api/companies'),
          fetch('/api/invites'),
        ])

        const [users, chapters, companies, invites] = await Promise.all([
          usersRes.json(),
          chaptersRes.json(),
          companiesRes.json(),
          invitesRes.json(),
        ])

        setStats({
          totalUsers: users.users?.length || 0,
          totalChapters: chapters.chapters?.length || 0,
          totalCompanies: companies.companies?.length || 0,
          pendingInvites: invites.invites?.filter((i: any) => !i.acceptedAt).length || 0,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your LEAD platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all chapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalChapters}
            </div>
            <p className="text-xs text-muted-foreground">
              Active chapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalCompanies}
            </div>
            <p className="text-xs text-muted-foreground">
              Partner companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.pendingInvites}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/chapters">
              <GraduationCap className="h-5 w-5 mb-2" />
              <span className="font-semibold">Manage Chapters</span>
              <span className="text-xs text-muted-foreground">
                View and edit chapters
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/users">
              <Users className="h-5 w-5 mb-2" />
              <span className="font-semibold">Manage Users</span>
              <span className="text-xs text-muted-foreground">
                Assign roles and permissions
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/companies">
              <Building2 className="h-5 w-5 mb-2" />
              <span className="font-semibold">Manage Companies</span>
              <span className="text-xs text-muted-foreground">
                Add and configure companies
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
            <Link href="/admin/invites">
              <Mail className="h-5 w-5 mb-2" />
              <span className="font-semibold">View Invites</span>
              <span className="text-xs text-muted-foreground">
                Manage recruiter invitations
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Activity log coming soon...
          </p>
          <Button asChild variant="link" className="px-0">
            <Link href="/admin/activity">View full activity log →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}