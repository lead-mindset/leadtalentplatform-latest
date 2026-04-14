import type { Metadata } from 'next'
import { BriefcaseBusiness, Users, Zap } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '../_components/navbar'

export const metadata: Metadata = {
  title: 'Partner Info',
  description: 'Information for partners and company collaborators on LEAD.',
}

export default function PartnerInfo() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-16 pt-28">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              For partners
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">Partner Information</h1>
            <p className="max-w-3xl text-muted-foreground">
              LEAD connects companies with student talent through chapter communities, curated
              visibility controls, and event-based recruiting workflows.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Student visibility</CardTitle>
                <CardDescription>
                  Recruiters only browse profiles from students who have explicitly opted in.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                <CardTitle>Company workflows</CardTitle>
                <CardDescription>
                  Invite teammates, save prospects, and manage recruiting access centrally.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Events and applications</CardTitle>
                <CardDescription>
                  Support chapter events with open registration or application review flows.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>
                Ready to work with LEAD or need company account support?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/company/login">Company login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/help">Visit help center</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
