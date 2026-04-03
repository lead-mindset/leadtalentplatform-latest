'use server'

import { createServiceClient } from '@/lib/supabase/server-service'

export async function acceptInvite(formData: {
  inviteToken: string
  name: string
}) {
  const serviceSupabase = createServiceClient()

  const { data: invite, error: inviteError } = await serviceSupabase
    .from('RecruiterAccess')
    .select('*')
    .eq('inviteToken', formData.inviteToken)
    .maybeSingle()

  if (!invite || inviteError) {
    return { success: false, error: 'Invalid invite token' }
  }

  if (invite.revokedAt) {
    return { success: false, error: 'This invitation has been revoked' }
  }
  if (invite.acceptedAt) {
    return { success: false, error: 'This invitation has already been accepted' }
  }
  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
    return { success: false, error: 'This invitation has expired. Please contact your administrator for a new invite.' }
  }

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
  const { error: otpError } = await serviceSupabase.auth.signInWithOtp({
    email: invite.recruiterEmail,
    options: {
      emailRedirectTo: `${process.env.FRONTEND_URL}/auth/confirm?next=/company/dashboard`,
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
  const supabase = createServiceClient()

  const { data: invite, error } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .match({ inviteToken })
    .maybeSingle()

  if (error) {
    console.error('[validateInviteToken] Database error:', error)
    return { success: false, error: 'Database error: ' + error.message }
  }

  if (!invite) {
    return { success: false, error: 'Invalid invite token' }
  }

  if (invite.revokedAt) return { success: false, error: 'This invitation has been revoked' }
  if (invite.acceptedAt) return { success: false, error: 'This invitation has already been accepted' }
  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
    return { success: false, error: 'This invitation has expired. Please contact your administrator.' }
  }

  let company = null
  if (invite.companyId) {
    const { data: companyData, error: companyError } = await supabase
      .from('Company')
      .select('id, name')
      .eq('id', invite.companyId)
      .maybeSingle()

    if (companyError) console.error('[validateInviteToken] Company fetch error:', companyError)
    company = companyData
  }

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