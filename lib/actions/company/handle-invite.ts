'use server'

import { createServiceClient } from '@/lib/supabase/server-service'
import { CompanyService } from '@/lib/services/company.service'

export async function acceptInvite(formData: {
  inviteToken: string
  name: string
  locale: string
}) {
  const serviceSupabase = createServiceClient()
  return CompanyService.acceptInvite(serviceSupabase, formData)
}

export async function validateInviteToken(inviteToken: string) {
  const serviceSupabase = createServiceClient()
  const inviteResult = await CompanyService.getValidatedRecruiterInvite(serviceSupabase, inviteToken)
  if (!inviteResult.success) {
    return inviteResult
  }
  const { invite } = inviteResult

  const company = invite.company_id ? await CompanyService.getInviteCompany(serviceSupabase, invite.company_id) : null

  return {
    success: true,
    data: {
      companyId: company?.id ?? invite.company_id,
      companyName: company?.name ?? null,
      recruiterEmail: invite.recruiter_email,
      inviteId: invite.id,
    },
  }
}
