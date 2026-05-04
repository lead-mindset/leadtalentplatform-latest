'use server'

import { requireRecruiter } from '@/lib/auth'
import { CompanyService } from '@/lib/services/company.service'

export async function openTalentResumeAction(
  profileId: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const { supabase, user } = await requireRecruiter()
  return CompanyService.createResumeDownloadUrl(supabase, user.id, profileId)
}
