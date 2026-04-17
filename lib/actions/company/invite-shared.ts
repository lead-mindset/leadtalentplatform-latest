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
  'id, recruiter_email, is_active, granted_at, granted_by_id, invite_token, invite_expires_at, accepted_at, accepted_by_user_id, company_id, revoked_at, revoked_by_id'

export async function getValidatedRecruiterInvite(inviteToken: string): Promise<InviteValidationSuccess | InviteValidationFailure> {
  const supabase = createServiceClient()

  const { data: invite, error } = await supabase
    .from('recruiter_access')
    .select(INVITE_SELECT)
    .eq('invite_token', inviteToken)
    .maybeSingle<RecruiterAccessRow>()

  if (error) {
    console.error('[getValidatedRecruiterInvite] Database error:', error)
    return { success: false, error: `Database error: ${error.message}` }
  }

  if (!invite) {
    return { success: false, error: 'Invalid invite token' }
  }

  if (invite.revoked_at) {
    return { success: false, error: 'This invitation has been revoked' }
  }

  if (invite.accepted_at) {
    return { success: false, error: 'This invitation has already been accepted' }
  }

  if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
    return { success: false, error: 'This invitation has expired. Please contact your administrator.' }
  }

  return { success: true, invite }
}

export async function getInviteCompany(companyId: string): Promise<Pick<CompanyRow, 'id' | 'name'> | null> {
  const supabase = createServiceClient()

  const { data: company, error } = await supabase
    .from('company')
    .select('id, name')
    .eq('id', companyId)
    .maybeSingle<Pick<CompanyRow, 'id' | 'name'>>()

  if (error) {
    console.error('[getInviteCompany] Company fetch error:', error)
    return null
  }

  return company
}
