'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const inviteAcceptanceSchema = z.object({
  token: z.string().trim().min(1),
  userId: z.string().trim().min(1),
})

type AcceptInviteResult =
  | { success: true }
  | { success: false; error: string }

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
    .from('recruiter_access')
    .select('id, recruiter_email, accepted_at, accepted_by_user_id, invite_expires_at, revoked_at, company_id')
    .eq('invite_token', normalized)
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
      recruiter_email: data.recruiter_email,
      accepted_at: data.accepted_at,
      accepted_by_user_id: data.accepted_by_user_id,
      invite_expires_at: data.invite_expires_at,
      revoked_at: data.revoked_at,
      company_id: data.company_id,
    },
  }
}

export async function acceptInvite(token: string, userId: string): Promise<AcceptInviteResult> {
  const parsed = inviteAcceptanceSchema.safeParse({ token, userId })
  if (!parsed.success) {
    return { success: false, error: 'A valid invite token is required.' }
  }

  const validation = await validateInviteToken(parsed.data.token)
  if (!validation.valid) return { success: false, error: validation.error }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== parsed.data.userId) {
    return { success: false, error: 'Authentication required.' }
  }

  const authEmail = auth.user.email?.toLowerCase() ?? ''
  const invitedEmail = validation.access.recruiter_email.toLowerCase()
  if (authEmail !== invitedEmail) {
    return {
      success: false,
      error: `This invite was sent to ${validation.access.recruiter_email}. Please sign in with that email address.`,
    }
  }

  if (validation.access.accepted_at) {
    return { success: true }
  }

  const now = new Date().toISOString()

  const { error: updateInviteError } = await supabase
    .from('recruiter_access')
.update({
      accepted_at: now,
      accepted_by_user_id: parsed.data.user_id,
      is_active: true,
    })
    .eq('id', validation.access.id)

  if (updateInviteError) {
    console.error('[recruiter/access] acceptInvite update error:', updateInviteError)
    return { success: false, error: 'Failed to accept invite.' }
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from('user')
    .select('id')
    .eq('id', parsed.data.userId)
    .maybeSingle()

  if (existingUserError) {
    console.error('[recruiter/access] existing user lookup error:', existingUserError)
    return { success: false, error: 'Failed to accept invite.' }
  }

  if (existingUser) {
    const { error: roleError } = await supabase
      .from('user')
      .update({ role: 'recruiter', updated_at: now })
      .eq('id', parsed.data.userId)

    if (roleError) {
      console.error('[recruiter/access] role update error:', roleError)
      return { success: false, error: 'Failed to accept invite.' }
    }
  } else {
    const { error: createUserError } = await supabase.from('user').insert({
      id: parsed.data.userId,
      email: auth.user.email ?? validation.access.recruiterEmail,
      name: auth.user.user_metadata?.full_name ?? auth.user.user_metadata?.name ?? '',
      role: 'recruiter',
      phone: null,
      created_at: now,
      updated_at: now,
      deactivated_at: null,
    })
    if (createUserError) {
      console.error('[recruiter/access] user insert error:', createUserError)
      return { success: false, error: 'Failed to accept invite.' }
    }
  }

  revalidatePath('/company/onboard')
  revalidatePath('/company')
  revalidatePath('/company/dashboard')
  revalidatePath('/recruiter/access')

  return { success: true }
}
