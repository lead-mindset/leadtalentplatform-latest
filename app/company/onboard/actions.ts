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
  const serviceSupabase = createServiceClient() // service role
  const supabase = await createClient() // cookie-aware (for login)

  const { data: invite, error: inviteError } = await serviceSupabase
    .from('RecruiterAccess')
    .select('*')
    .eq('inviteToken', formData.inviteToken)
    .maybeSingle()

  if (!invite || inviteError) {
    console.error('[acceptInvite] Invite fetch failed:', inviteError)
    return { success: false, error: 'Invalid invite token' }
  }
  
  if (invite.revokedAt) return { success: false, error: 'Invite revoked' }
  if (invite.acceptedAt) return { success: false, error: 'Invite already accepted' }

  // Check for existing user
  const { data: existingUser } = await serviceSupabase
    .from('User')
    .select('id')
    .eq('email', invite.recruiterEmail)
    .maybeSingle()

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    console.log('[acceptInvite] Using existing user:', userId)
  } else {
    console.log('[acceptInvite] Creating new user for:', invite.recruiterEmail)
    
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: invite.recruiterEmail,
      password: formData.password,
      email_confirm: true,
    })

    if (!authData.user || authError) {
      console.error('[acceptInvite] Failed to create auth user:', authError)
      return { success: false, error: 'Failed to create auth account' }
    }

    userId = authData.user.id

    const { error: profileError } = await serviceSupabase
      .from('User')
      .insert({
        id: userId,
        email: invite.recruiterEmail,
        role: 'recruiter',
        name: formData.name || invite.recruiterEmail.split('@')[0],
      })

    if (profileError) {
      console.error('[acceptInvite] Failed to create User profile:', profileError)
      return { success: false, error: 'Failed to create profile' }
    }
    
    console.log('[acceptInvite] Created new user profile:', userId)
  }

  // Accept invite - CRITICAL: Set isActive to true
  const { error: updateError } = await serviceSupabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', invite.id)

  if (updateError) {
    console.error('[acceptInvite] Failed to update RecruiterAccess:', updateError)
    return { success: false, error: 'Failed to activate access' }
  }

  console.log('[acceptInvite] Successfully updated RecruiterAccess to active')

  // Sign in the user
  if (formData.password) {
    console.log('[acceptInvite] Signing in with password')
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.recruiterEmail,
      password: formData.password,
    })
    
    if (signInError) {
      console.error('[acceptInvite] Sign in failed:', signInError)
      return { success: false, error: 'Failed to sign in: ' + signInError.message }
    }
    
    console.log('[acceptInvite] Sign in successful, redirecting to /company')
  } else {
    console.log('[acceptInvite] Sending OTP email')
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: invite.recruiterEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/company`,
      }
    })
    
    if (otpError) {
      console.error('[acceptInvite] OTP send failed:', otpError)
      return { success: false, error: 'Failed to send login email' }
    }
    
    // For OTP, don't redirect - let user know to check email
    return { 
      success: true, 
      requiresEmailVerification: true,
      message: 'Check your email for a login link' 
    }
  }

  // Only redirect after successful password sign-in
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