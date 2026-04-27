'use server'

import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { StudentService } from '@/lib/services/student.service'

const MAX_RESUME_SIZE = 10 * 1024 * 1024

const resumeUploadSchema = z.object({
  file: z.instanceof(File),
})

type UploadResumeResult =
  | { success: true; publicUrl: string }
  | { success: false; error: string }

export async function uploadResume(formData: FormData): Promise<UploadResumeResult> {
  const { supabase, user } = await requireUser()

  const parsed = resumeUploadSchema.safeParse({
    file: formData.get('resume'),
  })
  if (!parsed.success) {
    return { success: false, error: 'Resume file is required.' }
  }

  const file = parsed.data.file
  if (file.type !== 'application/pdf') {
    return { success: false, error: 'Only PDF files are allowed.' }
  }
  if (file.size > MAX_RESUME_SIZE) {
    return { success: false, error: 'Resume must be smaller than 10MB.' }
  }

  const result = await StudentService.saveResume(supabase, user.id, file)
  if (result.success) {
    revalidatePath('/student/resume')
    revalidatePath('/student')
  }
  return result
}
