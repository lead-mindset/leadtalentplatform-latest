import type { RecruiterAccessRow, CompanyRow } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server-service'
import { CompanyService } from '@/lib/services/company.service'

export type InviteValidationFailure = {
  success: false
  error: string
}

export async function getValidatedRecruiterInvite(inviteToken: string): Promise<
  | { success: true; invite: RecruiterAccessRow }
  | InviteValidationFailure
> {
  const supabase = createServiceClient()
  return CompanyService.getValidatedRecruiterInvite(supabase, inviteToken)
}

export async function getInviteCompany(companyId: string): Promise<Pick<CompanyRow, 'id' | 'name'> | null> {
  const supabase = createServiceClient()
  return CompanyService.getInviteCompany(supabase, companyId)
}
