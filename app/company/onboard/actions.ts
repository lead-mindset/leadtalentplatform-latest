'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server-service'

import bcrypt from 'bcryptjs'

async function auditLog(action: string, details: any) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}`, details)
}

export async function acceptInvite(formData: {
  inviteToken: string
  password?: string
  name?: string
}) {
  const supabase = createServiceClient()

  console.log('🚀 acceptInvite', formData.inviteToken)


  const { data: invite, error: inviteError } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .eq('inviteToken', formData.inviteToken)
    .maybeSingle()

  console.log('📦 invite', invite, inviteError)

  if (!invite || inviteError) {
    return { success: false, error: 'Invalid invite token' }
  }

  if (invite.revokedAt) {
    return { success: false, error: 'This invite has been revoked' }
  }

  if (invite.acceptedAt) {
    return { success: false, error: 'This invite has already been accepted' }
  }

  const { data: existingUser } = await supabase
    .from('User')
    .select('id')
    .eq('email', invite.recruiterEmail)
    .maybeSingle()

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    console.log('👤 Using existing user', userId)
  } else {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: invite.recruiterEmail,
        password: formData.password, 
        email_confirm: true,
      })

    console.log('🔐 auth user', authData, authError)

    if (authError || !authData.user) {
      return { success: false, error: 'Failed to create auth account' }
    }

    userId = authData.user.id

    const { error: profileError } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: invite.recruiterEmail,
        role: 'recruiter',
        name: formData.name || invite.recruiterEmail.split('@')[0],
      })

    console.log('🧾 profile insert', profileError)

    if (profileError) {
      return { success: false, error: 'Failed to create user profile' }
  }
}


  const { error: updateError } = await supabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', invite.id)

  console.log('✏️ invite update', updateError)

  if (updateError) {
    return { success: false, error: 'Failed to update invite' }
  }


  if (formData.password) {
    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: invite.recruiterEmail,
        password: formData.password,
      })

    console.log('🔑 sign-in', signInError)

    if (signInError) {
      return { success: false, error: 'Login failed' }
    }
  } else {
    const { error: otpError } =
      await supabase.auth.signInWithOtp({
        email: invite.recruiterEmail,
      })

    console.log('✉️ magic link', otpError)

    if (otpError) {
      return { success: false, error: 'Login failed' }
    }
  }


  redirect('/company')
}


export async function validateInviteToken(inviteToken: string) {
console.log('--- validateInviteToken START ---')
console.log('Token received:', inviteToken)

  const supabase = createServiceClient() 

const { data: invite, error } = await supabase
  .from('RecruiterAccess')
  .select('*')
  .match({ inviteToken })
  .maybeSingle()

console.log('Supabase invite data:', invite, 'error:', error)

  if (error) {
    console.error('[validateInviteToken] Database error:', error)
    return { success: false, error: 'Database error: ' + error.message }
  }

  if (!invite) {
    console.warn('[validateInviteToken] Token not found in database:', inviteToken)
    return { success: false, error: 'Invalid invite token' }
  }

  if (invite.revokedAt) return { success: false, error: 'Invite revoked' }
  if (invite.acceptedAt) return { success: false, error: 'Invite already accepted' }

  console.log('[validateInviteToken] Invite row found:', invite)

  let company = null
  if (invite.companyId) {
    const { data: companyData, error: companyError } = await supabase
      .from('Company')
      .select('id, name')
      .eq('id', invite.companyId)
      .maybeSingle()

    if (companyError) console.error('[validateInviteToken] Company fetch error:', companyError)
    company = companyData
    console.log('[validateInviteToken] Company row fetched:', company)
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
