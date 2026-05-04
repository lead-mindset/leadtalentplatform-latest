import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight, Building2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { validateInviteToken } from '@/lib/actions/company/handle-invite'

type OnboardPageProps = {
  searchParams: Promise<{
    inviteToken?: string
    access?: string
  }>
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary/5 via-secondary/10 to-accent/5 p-4">
      {children}
    </div>
  )
}

function HelpCard({
  title,
  description,
  detail,
  primaryHref,
  primaryLabel,
}: {
  title: string
  description: string
  detail?: string
  primaryHref: string
  primaryLabel: string
}) {
  return (
    <PageShell>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail ? (
            <Alert>
              <AlertDescription>{detail}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/company/login">Company login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

function InviteIssueCard({ message }: { message: string }) {
  return (
    <PageShell>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Invite Link Issue</CardTitle>
          </div>
          <CardDescription>Company access is invite-only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/company/login">Company login</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/help">Get help</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export default async function CompanyOnboardPage({ searchParams }: OnboardPageProps) {
  const { inviteToken, access } = await searchParams

  if (!inviteToken) {
    return (
      <HelpCard
        title="Company Access"
        description="Company representative access is managed by invite."
        detail={
          access === 'missing'
            ? 'Your account is signed in, but it does not have active company access yet.'
            : 'If you already accepted an invite, continue to company login. If you have an invite link, open it from your email.'
        }
        primaryHref="/company/login"
        primaryLabel="Continue to login"
      />
    )
  }

  const result = await validateInviteToken(inviteToken)

  if (!result.success) {
    return <InviteIssueCard message={result.error} />
  }

  const accessHref = `/recruiter/access?token=${encodeURIComponent(inviteToken)}`

  return (
    <HelpCard
      title="Continue Company Access"
      description={
        result.data.companyName
          ? `This invite is for ${result.data.companyName}.`
          : 'This company invite needs to be accepted through the signed-in access flow.'
      }
      detail={`Invite email: ${result.data.recruiterEmail}`}
      primaryHref={accessHref}
      primaryLabel="Continue to access"
    />
  )
}
