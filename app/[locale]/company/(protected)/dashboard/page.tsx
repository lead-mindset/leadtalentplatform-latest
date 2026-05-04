import { getCompanyStats, getSavedStudents } from '@/lib/actions/company/get-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Heart, Building } from 'lucide-react'
import Link from 'next/link'
import { requireRecruiter } from '@/lib/auth'

export default async function CompanyDashboardPage() {
  const { supabase, user } = await requireRecruiter()

  const [stats, recentSaved] = await Promise.all([
    getCompanyStats(supabase, user.id),
    getSavedStudents(supabase, user.id),
  ])

  const recentlySaved = recentSaved.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Company Portal</h1>
        <p className="text-muted-foreground">Welcome back, {user.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Talent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_students}</div>
            <p className="text-xs text-muted-foreground">Available to view</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Talent</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.saved_students}</div>
            <p className="text-xs text-muted-foreground">In your collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{user.company?.name}</div>
            <p className="text-xs text-muted-foreground">Your organization</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/company/browse">
                <Users className="mr-2 h-4 w-4" />
                Browse Talent
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/company/saved">
                <Heart className="mr-2 h-4 w-4" />
                View Saved Talent
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Saved</CardTitle>
            <CardDescription>Profiles you&apos;ve saved recently</CardDescription>
          </CardHeader>
          <CardContent>
            {recentlySaved.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No saved talent yet</p>
                <Button asChild variant="link" size="sm" className="mt-2">
                  <Link href="/company/browse">Start browsing</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentlySaved.map((saved) => (
                  <div key={saved.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{saved.student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {saved.student.person_profile?.major_or_interest || 'No major listed'}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/company/students/${saved.student_id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
