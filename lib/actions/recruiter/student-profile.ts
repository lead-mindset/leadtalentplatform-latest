'use server'

import { requireRecruiter } from '@/lib/auth'
import { RecruiterService } from '@/lib/services/recruiter.service'
import { CompanyService } from '@/lib/services/company.service'

export async function getStudentProfileForRecruiter(studentId: string) {
  const { supabase } = await requireRecruiter()
  return RecruiterService.getStudentProfile(supabase, studentId)
}

export async function downloadResume(studentId: string) {
  const { supabase, user } = await requireRecruiter()
  return CompanyService.createResumeDownloadUrl(supabase, user.id, studentId)
}
