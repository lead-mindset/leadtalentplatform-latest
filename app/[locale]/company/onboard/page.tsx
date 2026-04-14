import { Suspense } from 'react'
import OnboardContent from './onboard-content'
import { redirect } from 'next/navigation'
import { validateInviteToken } from '@/lib/actions/company/handle-invite'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Link } from '@/i18n/routing'

function OnboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 via-secondary/10 to-accent/5">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function OnboardLoader({ 
  searchParams 
}: { 
  searchParams: Promise<{ inviteToken?: string }> 
}) {
  const { inviteToken } = await searchParams

  if (!inviteToken) {
    redirect('/auth/login')
  }

  const result = await validateInviteToken(inviteToken)

  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-2xl text-destructive">
                Invalid Invite
              </CardTitle>
            </div>
            <CardDescription className="text-foreground">
              {result.error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <OnboardContent
      inviteToken={inviteToken}
      companyName={result.data!.companyName}
      recruiterEmail={result.data!.recruiterEmail}
    />
  )
}

export default function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ inviteToken?: string }>
}) {
  return (
    <Suspense fallback={<OnboardLoading />}>
      <OnboardLoader searchParams={searchParams} />
    </Suspense>
  )
}
