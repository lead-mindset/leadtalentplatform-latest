'use server'

import { requireRecruiter } from '@/lib/auth'
import { RecruiterService } from '@/lib/services/recruiter.service'

export async function getStudentProfileForRecruiter(studentId: string) {
  const { supabase } = await requireRecruiter()
  return RecruiterService.getStudentProfile(supabase, studentId)
}

export async function downloadResume(studentId: string) {
  const { supabase, user } = await requireRecruiter()
  const student = await RecruiterService.getStudentProfile(supabase, studentId)

  if (!student?.resume?.file_url) {
    return { success: false, error: 'Resume not available.' }
  }

  const result = await RecruiterService.downloadResume(
    supabase,
    user.id,
    studentId,
    student.resume.file_url
  )

  return result
}
