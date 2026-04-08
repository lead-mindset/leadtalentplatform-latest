'use server'

import { createClient } from '@/lib/supabase/server'

type TokenValidationResult =
  | {
      valid: true
      access: {
        id: string
        recruiterEmail: string
        acceptedAt: string | null
        acceptedByUserId: string | null
        inviteExpiresAt: string | null
        revokedAt: string | null
        companyId: string
      }
    }
  | { valid: false; error: string; code: 'invalid' | 'expired' | 'revoked' }

export async function validateInviteToken(token: string): Promise<TokenValidationResult> {
  const normalized = token.trim()
  if (!normalized) {
    return {
      valid: false,
      code: 'invalid',
      error: "This invite link isn't valid. Contact your LEAD representative.",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('RecruiterAccess')
    .select('id, recruiterEmail, acceptedAt, acceptedByUserId, inviteExpiresAt, revokedAt, companyId')
    .eq('inviteToken', normalized)
    .maybeSingle()

  if (error || !data) {
    return {
      valid: false,
      code: 'invalid',
      error: "This invite link isn't valid. Contact your LEAD representative.",
    }
  }

  if (data.revokedAt) {
    return {
      valid: false,
      code: 'revoked',
      error: "This invite link isn't valid. Contact your LEAD representative.",
    }
  }

  if (data.inviteExpiresAt && new Date(data.inviteExpiresAt).getTime() <= Date.now()) {
    return {
      valid: false,
      code: 'expired',
      error:
        'This invite link has expired. Reach out to support@leadtalentplatform.com to request a new one.',
    }
  }

  return {
    valid: true,
    access: {
      id: data.id,
      recruiterEmail: data.recruiterEmail,
      acceptedAt: data.acceptedAt,
      acceptedByUserId: data.acceptedByUserId,
      inviteExpiresAt: data.inviteExpiresAt,
      revokedAt: data.revokedAt,
      companyId: data.companyId,
    },
  }
}

export async function acceptInvite(token: string, userId: string) {
  const validation = await validateInviteToken(token)
  if (!validation.valid) return { success: false, error: validation.error }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== userId) {
    return { success: false, error: 'Authentication required.' }
  }

  const authEmail = auth.user.email?.toLowerCase() ?? ''
  const invitedEmail = validation.access.recruiterEmail.toLowerCase()
  if (authEmail !== invitedEmail) {
    return {
      success: false,
      error: `This invite was sent to ${validation.access.recruiterEmail}. Please sign in with that email address.`,
    }
  }

  if (validation.access.acceptedAt) {
    return { success: true }
  }

  const now = new Date().toISOString()

  const { error: updateInviteError } = await supabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: now,
      acceptedByUserId: userId,
      isActive: true,
    })
    .eq('id', validation.access.id)

  if (updateInviteError) {
    console.error('[recruiter/access] acceptInvite update error:', updateInviteError)
    return { success: false, error: 'Failed to accept invite.' }
  }

  const { data: existingUser } = await supabase
    .from('User')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existingUser) {
    const { error: roleError } = await supabase
      .from('User')
      .update({ role: 'recruiter', updatedAt: now })
      .eq('id', userId)

    if (roleError) {
      console.error('[recruiter/access] role update error:', roleError)
    }
  } else {
    const { error: createUserError } = await supabase.from('User').insert({
      id: userId,
      email: auth.user.email ?? validation.access.recruiterEmail,
      name: auth.user.user_metadata?.full_name ?? auth.user.user_metadata?.name ?? '',
      role: 'recruiter',
      phone: null,
      createdAt: now,
      updatedAt: now,
      deactivatedAt: null,
    })
    if (createUserError) {
      console.error('[recruiter/access] user insert error:', createUserError)
    }
  }

  return { success: true }
}
