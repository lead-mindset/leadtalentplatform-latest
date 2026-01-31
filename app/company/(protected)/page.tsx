import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CompanyDashboard() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  const { data: user, error: userError } = await supabase
    .from('User')
    .select('id, name, email, role')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    redirect('/auth/login')
  }

  // Get company info
  const { data: recruiterAccess, error: accessError } = await supabase
    .from('RecruiterAccess')
    .select(`
      companyId, 
      isActive,
      Company (
        name, 
        id
      )
    `)
    .eq('acceptedByUserId', user.id)
    .eq('isActive', true)
    .is('revokedAt', null)
    .maybeSingle()

  // If no active access, redirect to onboarding
  if (!recruiterAccess || !recruiterAccess.isActive) {
    redirect('/company/onboard')
  }

  const company = Array.isArray(recruiterAccess.Company)
    ? recruiterAccess.Company[0]
    : recruiterAccess.Company

  const { data: profile } = await supabase
    .from('RecruiterProfile')
    .select('isFilled')
    .eq('userId', user.id)
    .maybeSingle()

  const isProfileComplete = profile?.isFilled || false

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.name || 'Recruiter'}!
        </h1>
        <p className="text-muted-foreground">
          Managing recruitment for {company?.name || 'your company'}
        </p>
      </div>

      {!isProfileComplete && (
        <Card className="mb-6 border-chart-2 bg-chart-2/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-chart-2">Complete Your Profile</h3>
                <p className="text-sm text-chart-2/80">
                  Add your details to get the most out of the platform
                </p>
              </div>
              <Link href="/company/profile">
                <Button variant="outline" size="sm">
                  Complete Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Building2 className="h-8 w-8 text-chart-5 mb-2" />
            <CardTitle>Company Info</CardTitle>
            <CardDescription>
              View and manage company details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{company?.name || 'N/A'}</p>
          </CardContent>
        </Card>

        <Link href="/company/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <Users className="h-8 w-8 text-chart-4 mb-2" />
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Update your recruiter information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm">
                Edit Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <FileText className="h-8 w-8 text-chart-3 mb-2" />
            <CardTitle>Job Posts</CardTitle>
            <CardDescription>
              Manage your active job listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Applications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hires</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest actions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
            <p>No recent activity to display</p>
            <p className="text-sm mt-2">Start by completing your profile or creating a job post</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}