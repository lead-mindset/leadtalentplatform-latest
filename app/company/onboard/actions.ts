'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

async function auditLog(action: string, details: any) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}`, details)
}

export async function acceptInvite(formData: {
  inviteToken: string
  password?: string
  name?: string
}) {
  const supabase = await createClient()

  const { data: invite, error: inviteError } = await supabase
    .from('RecruiterAccess')
    .select('*, Company(name, id)')
    .eq('inviteToken', formData.inviteToken)
    .maybeSingle()

  if (inviteError || !invite) {
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
    .select('id, email')
    .eq('email', invite.recruiterEmail)
    .maybeSingle()

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  } else {

    const userData: any = {
      email: invite.recruiterEmail,
      role: 'recruiter',
      name: formData.name || invite.recruiterEmail.split('@')[0],
    }

    if (formData.password) {
      const hashedPassword = await bcrypt.hash(formData.password, 10)
      userData.password = hashedPassword
    }

    const { data: newUser, error: userError } = await supabase
      .from('User')
      .insert(userData)
      .select('id')
      .single()

    if (userError || !newUser) {
      return { success: false, error: 'Failed to create user account' }
    }

    userId = newUser.id
  }

  const { error: updateError } = await supabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', invite.id)

  if (updateError) {
    return { success: false, error: 'Failed to update invite status' }
  }

  if (formData.password) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.recruiterEmail,
      password: formData.password,
    })

    if (signInError) {
      return { success: false, error: 'Account created but login failed. Please try logging in.' }
    }
  } else {
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: invite.recruiterEmail,
    })

    if (magicLinkError) {
      return { success: false, error: 'Account created but session creation failed' }
    }
  }

  await auditLog('ACCEPT_INVITE', {
    userId,
    inviteId: invite.id,
    companyId: invite.companyId,
    recruiterEmail: invite.recruiterEmail,
  })

  redirect('/company')
}

export async function validateInviteToken(inviteToken: string) {
  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from('RecruiterAccess')
    .select('*, Company(name, id, logo)')
    .eq('inviteToken', inviteToken)
    .maybeSingle()

  if (error) {
    console.error('[validateInviteToken] Database error:', error)
    return { success: false, error: 'Database error: ' + error.message }
  }

  if (!invite) {
    console.error('[validateInviteToken] Token not found:', inviteToken)
    return { success: false, error: 'Invalid invite token - not found in database' }
  }

  if (invite.revokedAt) {
    return { success: false, error: 'This invite has been revoked' }
  }

  if (invite.acceptedAt) {
    return { success: false, error: 'This invite has already been accepted' }
  }

  return {
    success: true,
    data: {
      companyName: invite.Company?.name,
      companyId: invite.Company?.id,
      companyLogo: invite.Company?.logo,
      recruiterEmail: invite.recruiterEmail,
    },
  }
}