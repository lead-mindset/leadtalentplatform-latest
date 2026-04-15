import type { CompanyRow, RecruiterAccessRow } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server-service'

type InviteValidationSuccess = {
  success: true
  invite: RecruiterAccessRow
}

export type InviteValidationFailure = {
  success: false
  error: string
}

const INVITE_SELECT =
  'id, recruiterEmail, isActive, grantedAt, grantedById, inviteToken, inviteExpiresAt, acceptedAt, acceptedByUserId, companyId, revokedAt, revokedById'

export async function getValidatedRecruiterInvite(inviteToken: string): Promise<InviteValidationSuccess | InviteValidationFailure> {
  const supabase = createServiceClient()

  const { data: invite, error } = await supabase
    .from('RecruiterAccess')
    .select(INVITE_SELECT)
    .eq('inviteToken', inviteToken)
    .maybeSingle<RecruiterAccessRow>()

  if (error) {
    console.error('[getValidatedRecruiterInvite] Database error:', error)
    return { success: false, error: `Database error: ${error.message}` }
  }

  if (!invite) {
    return { success: false, error: 'Invalid invite token' }
  }

  if (invite.revokedAt) {
    return { success: false, error: 'This invitation has been revoked' }
  }

  if (invite.acceptedAt) {
    return { success: false, error: 'This invitation has already been accepted' }
  }

  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
    return { success: false, error: 'This invitation has expired. Please contact your administrator.' }
  }

  return { success: true, invite }
}

export async function getInviteCompany(companyId: string): Promise<Pick<CompanyRow, 'id' | 'name'> | null> {
  const supabase = createServiceClient()

  const { data: company, error } = await supabase
    .from('Company')
    .select('id, name')
    .eq('id', companyId)
    .maybeSingle<Pick<CompanyRow, 'id' | 'name'>>()

  if (error) {
    console.error('[getInviteCompany] Company fetch error:', error)
    return null
  }

  return company
}
