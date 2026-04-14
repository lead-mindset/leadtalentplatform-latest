'use server'

import { createServiceClient } from '@/lib/supabase/server-service'
import { getInviteCompany, getValidatedRecruiterInvite } from './invite-shared'

export async function acceptInvite(formData: {
  inviteToken: string
  name: string
  locale: string
}) {
  const serviceSupabase = createServiceClient()

  const inviteResult = await getValidatedRecruiterInvite(formData.inviteToken)
  if (!inviteResult.success) {
    return inviteResult
  }

  const { invite } = inviteResult

  const { data: existingUser } = await serviceSupabase
    .from('User')
    .select('id')
    .eq('email', invite.recruiterEmail)
    .maybeSingle()

  let userId: string

  if (existingUser) {
    userId = existingUser.id

    await serviceSupabase
      .from('User')
      .update({
        name: formData.name,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
  } else {
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: invite.recruiterEmail,
      email_confirm: true,
    })

    if (!authData.user || authError) {
      console.error('[acceptInvite] Auth creation failed:', authError)
      return { success: false, error: 'Failed to create account' }
    }

    userId = authData.user.id

    const { error: profileError } = await serviceSupabase
      .from('User')
      .insert({
        id: userId,
        email: invite.recruiterEmail,
        role: 'recruiter',
        name: formData.name,
      })

    if (profileError) {
      console.error('[acceptInvite] Profile creation failed:', profileError)
      return { success: false, error: 'Failed to create profile' }
    }
  }

  // Activate the invite
  const { error: updateError } = await serviceSupabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', invite.id)

  if (updateError) {
    console.error('[acceptInvite] Activation failed:', updateError)
    return { success: false, error: 'Failed to activate access' }
  }

  // Send OTP magic link for login
  const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000').trim()
  const { error: otpError } = await serviceSupabase.auth.signInWithOtp({
    email: invite.recruiterEmail,
    options: {
      emailRedirectTo: `${baseUrl}/${formData.locale}/auth/confirm?next=/company/dashboard`,
    },
  })

  if (otpError) {
    console.error('[acceptInvite] OTP send failed:', otpError)
    return {
      success: true,
      warning: 'Account created! Please use the login page to access your dashboard.',
      recruiterEmail: invite.recruiterEmail,
    }
  }

  return {
    success: true,
    message: 'Check your email for a login link',
    recruiterEmail: invite.recruiterEmail,
  }
}

export async function validateInviteToken(inviteToken: string) {
  const inviteResult = await getValidatedRecruiterInvite(inviteToken)
  if (!inviteResult.success) {
    return inviteResult
  }
  const { invite } = inviteResult

  const company = invite.companyId ? await getInviteCompany(invite.companyId) : null

  return {
    success: true,
    data: {
      companyId: company?.id ?? invite.companyId,
      companyName: company?.name ?? null,
      recruiterEmail: invite.recruiterEmail,
      inviteId: invite.id,
    },
  }
}
