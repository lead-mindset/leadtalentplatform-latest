'use server'

import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

  const filePath = `${user.id}/${crypto.randomUUID()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return { success: false, error: 'Upload failed.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(filePath)

  const now = new Date().toISOString()

  const { error: upsertError } = await supabase
    .from('resume')
.upsert({
      student_id: user.id,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_at: now,
    }, {
      onConflict: 'student_id',
    })

  if (upsertError) {
    return { success: false, error: 'Failed to save resume.' }
  }

  revalidatePath('/student/resume')
  revalidatePath('/student')

  return { success: true, publicUrl }
}
