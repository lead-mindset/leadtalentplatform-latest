'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  searchParams: { token?: string }
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const token = searchParams.token
  if (!token) redirect('/company/onboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/company/onboard')

  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: user.id,
      isActive: true,
    })
    .eq('inviteToken', token)

  if (error) {
    console.error('Failed to accept invite:', error)
    redirect('/company/onboard?error=accept_failed')
  }

  redirect('/company')
}
