import { LifeBuoy, Mail, ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '../_components/navbar'

export const metadata = {
  title: 'Help',
  description: 'Get help using the LEAD Talent Platform.',
}

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-16 pt-28">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              Support
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
            <p className="max-w-2xl text-muted-foreground">
              Find the quickest path for account access, profile setup, event registration, and
              company onboarding support.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <LifeBuoy className="h-5 w-5 text-primary" />
                <CardTitle>Account help</CardTitle>
                <CardDescription>
                  Sign-in issues, chapter access, and student profile updates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Go to sign in</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Email support</CardTitle>
                <CardDescription>
                  Reach the team for invitations, approvals, or platform access questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                support@leadtalentplatform.com
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle>Privacy and policies</CardTitle>
                <CardDescription>
                  Review the platform terms and privacy expectations before onboarding.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/privacy">Privacy</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/terms">Terms</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
