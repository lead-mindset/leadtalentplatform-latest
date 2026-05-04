import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite, validateInviteToken } from '@/lib/actions/recruiter/access'
import { GoogleInviteSignInButton } from './google-invite-signin-button'

export default async function RecruiterAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams
  const validation = await validateInviteToken(token)

  if (!validation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invite Link Issue</CardTitle>
            <CardDescription>Recruiter access is invite-only.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{validation.error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Recruiter Access</CardTitle>
            <CardDescription>
              This invite was sent to <span className="font-medium">{validation.access.recruiter_email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleInviteSignInButton token={token} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const signedInEmail = user.email?.toLowerCase() ?? ''
  const invitedEmail = validation.access.recruiter_email.toLowerCase()

  if (signedInEmail !== invitedEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Email Mismatch</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {`This invite was sent to ${validation.access.recruiter_email}. Please sign in with that email address.`}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const accepted = await acceptInvite(token, user.id)
  if (!accepted.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Unable to Accept Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{accepted.error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  redirect('/company/dashboard')
}
