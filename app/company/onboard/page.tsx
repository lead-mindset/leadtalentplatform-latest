import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import InviteContent from './invite-content'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

async function checkRecruiterStatus(searchParams: { token?: string }) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser && searchParams.token) {
    return {
      isAuthenticated: false,
      user: null,
      pendingInvites: [],
      hasExpiredInvites: false,
      hasToken: true,
    }
  }

  if (!authUser) {
    return {
      isAuthenticated: false,
      user: null,
      pendingInvites: [],
      hasExpiredInvites: false,
      hasToken: false,
    }
  }

  const { data: userData } = await supabase
    .from('User')
    .select(
      `
      id,
      email,
      name,
      role,
      RecruiterAccess!RecruiterAccess_acceptedByUserId_fkey (
        id,
        isActive,
        revokedAt,
        acceptedAt,
        inviteExpiresAt,
        inviteToken,
        Company ( id, name )
      )
    `
    )
    .eq('id', authUser.id)
    .single()

  if (!userData) {
    return {
      isAuthenticated: false,
      user: null,
      pendingInvites: [],
      hasExpiredInvites: false,
      hasToken: !!searchParams.token,
    }
  }

  const activeAccess = userData.RecruiterAccess?.find(
    (a: any) => a.isActive && !a.revokedAt
  )

  if (activeAccess) {
    redirect('/company')
  }

  const { data: pendingByEmail } = await supabase
    .from('RecruiterAccess')
    .select(
      `
      id,
      recruiterEmail,
      inviteExpiresAt,
      acceptedAt,
      revokedAt,
      inviteToken,
      Company ( name )
    `
    )
    .eq('recruiterEmail', userData.email)
    .is('acceptedAt', null)
    .is('revokedAt', null)

  const now = new Date()

  const pendingInvites = (pendingByEmail || []).filter(
    (i: any) => !i.inviteExpiresAt || new Date(i.inviteExpiresAt) > now
  )

  const hasExpiredInvites = (pendingByEmail || []).some(
    (i: any) => i.inviteExpiresAt && new Date(i.inviteExpiresAt) < now
  )

  return {
    isAuthenticated: true,
    user: userData,
    pendingInvites,
    hasExpiredInvites,
    hasToken: !!searchParams.token,
  }
}

export default async function CompanyOnboardPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const status = await checkRecruiterStatus(searchParams)

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to Recruiter Portal
          </h1>
          <p className="text-muted-foreground">
            {status.hasToken
              ? 'Accept your invitation to get started'
              : 'You need an invitation to access student profiles'}
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <InviteContent
            pendingInvites={status.isAuthenticated ? status.pendingInvites : []}
            hasExpiredInvites={
              status.isAuthenticated ? status.hasExpiredInvites : false
            }
            isAuthenticated={status.isAuthenticated}
          />
        </Suspense>

        {status.isAuthenticated && !status.hasToken && (
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li>1. Your company admin sends an invitation email</li>
                <li>2. Click the invitation link</li>
                <li>3. Accept the invitation</li>
                <li>4. Start recruiting</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
