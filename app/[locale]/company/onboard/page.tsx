import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight, Building2, HelpCircle, Mail, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { validateInviteToken } from '@/lib/actions/company/handle-invite'

type OnboardPageProps = {
  searchParams: Promise<{
    inviteToken?: string
    access?: 'missing' | 'inactive' | 'revoked' | 'expired' | 'error'
  }>
}

const ACCESS_COPY = {
  missing: {
    title: 'Company Access Needed',
    detail: 'Your account is signed in, but it does not have active company access yet. Company portal access is granted by invite from a LEAD administrator.',
  },
  inactive: {
    title: 'Company Access Paused',
    detail: 'Your company access exists, but it is currently inactive. Ask your LEAD contact to reactivate access before continuing.',
  },
  revoked: {
    title: 'Company Access Revoked',
    detail: 'This company access was revoked. If this seems incorrect, contact the LEAD team for a new invitation.',
  },
  expired: {
    title: 'Company Access Expired',
    detail: 'This company invite or access window has expired. Request a new company access invite from the LEAD team.',
  },
  error: {
    title: 'Company Access Could Not Be Verified',
    detail: 'We could not verify your company access right now. Try again, or contact the LEAD team if the issue continues.',
  },
} as const

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Company portal access is invite-only and tied to the invited email address.</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Use the invite link from your email, or ask the LEAD team to resend it.</span>
            </div>
          </div>
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
              <Link href="/help">
                <HelpCircle className="mr-2 h-4 w-4" />
                Get help
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export default async function CompanyOnboardPage({ searchParams }: OnboardPageProps) {
  const { inviteToken, access } = await searchParams
  const accessCopy = access ? ACCESS_COPY[access] : null

  if (!inviteToken) {
    return (
      <HelpCard
        title={accessCopy?.title ?? 'Company Access'}
        description="Company representative access is managed by invite."
        detail={
          accessCopy?.detail ??
          'If you already accepted an invite, continue to company login. If you have an invite link, open it from your email.'
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
          : 'This company invite needs to be accepted through the signed-in company access flow.'
      }
      detail={`Invite email: ${result.data.recruiterEmail}`}
      primaryHref={accessHref}
      primaryLabel="Continue to access"
    />
  )
}
