import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite, validateInviteToken } from '@/lib/actions/recruiter/access'
import { GoogleInviteSignInButton } from './google-invite-signin-button'
import { Building2, HelpCircle, Mail, ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'

function AccessShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {children}
    </div>
  )
}

function AccessCard({
  title,
  description,
  children,
}: {
  title: string
  description: ReactNode
  children: ReactNode
}) {
  return (
    <AccessShell>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </AccessShell>
  )
}

function CompanyAccessNotes() {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Company access is invite-only and tied to the email address that received the invite.</span>
      </div>
      <div className="flex items-start gap-2">
        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
        <span>After acceptance, you will continue to the company portal.</span>
      </div>
    </div>
  )
}

export default async function RecruiterAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams
  const validation = await validateInviteToken(token)

  if (!validation.valid) {
    return (
      <AccessCard
        title="Company Invite Link Issue"
        description="Company representative access is managed by invitation."
      >
        <Alert variant="destructive">
          <AlertDescription>{validation.error}</AlertDescription>
        </Alert>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/company/login">Company login</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/help">
              <HelpCircle className="mr-2 h-4 w-4" />
              Get help
            </Link>
          </Button>
        </div>
      </AccessCard>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AccessCard
        title="Accept Company Access"
        description={
          <>
            This invite was sent to <span className="font-medium">{validation.access.recruiter_email}</span>.
          </>
        }
      >
        <CompanyAccessNotes />
        <GoogleInviteSignInButton token={token} />
      </AccessCard>
    )
  }

  const signedInEmail = user.email?.toLowerCase() ?? ''
  const invitedEmail = validation.access.recruiter_email.toLowerCase()

  if (signedInEmail !== invitedEmail) {
    return (
      <AccessCard
        title="Use the Invited Email"
        description="Company access must be accepted by the invited company representative."
      >
        <Alert variant="destructive">
          <AlertDescription>
            {`This invite was sent to ${validation.access.recruiter_email}. Please sign in with that email address.`}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-full">
          <Link href="/company/login">Company login</Link>
        </Button>
      </AccessCard>
    )
  }

  const accepted = await acceptInvite(token, user.id)
  if (!accepted.success) {
    return (
      <AccessCard
        title="Unable to Accept Company Access"
        description="We could not activate company portal access for this account."
      >
        <Alert variant="destructive">
          <AlertDescription>{accepted.error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-full">
          <Link href="/help">Get help</Link>
        </Button>
      </AccessCard>
    )
  }

  redirect('/company/dashboard')
}
