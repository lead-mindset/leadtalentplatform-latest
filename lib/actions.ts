'use server'

import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function uploadResume(formData: FormData) {
  const { supabase, user } = await requireUser()

  const file = formData.get('resume') as File | null
  if (!file) {
    throw new Error('Resume file is required')
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed')
  }

  const filePath = `${user.id}/${crypto.randomUUID()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      contentType: 'application/pdf',
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error('Upload failed')
  }

  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(filePath)

  const { error: insertError } = await supabase
    .from('Resume')
    .insert({
      studentId: user.id,
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    })

  if (insertError) {
    console.error('DB insert error:', insertError)

    await supabase.storage.from('resumes').remove([filePath])

    throw new Error('Failed to save resume')
  }

  revalidatePath('/student/resume')
}



export async function deleteResume(resumeId: string) {
  const { supabase, user } = await requireUser()

  const { data: resume, error: fetchError } = await supabase
    .from('Resume')
    .select('fileUrl')
    .eq('id', resumeId)
    .eq('studentId', user.id)
    .single()

  if (fetchError || !resume) {
    throw new Error('Resume not found')
  }

  const filePath = resume.fileUrl.split('/resumes/')[1]

  if (filePath) {
    const { error: storageError } = await supabase
      .storage
      .from('resumes')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      throw new Error('Failed to delete file')
    }
  }

  const { error: deleteError } = await supabase
    .from('Resume')
    .delete()
    .eq('id', resumeId)
    .eq('studentId', user.id)

  if (deleteError) {
    console.error('DB delete error:', deleteError)
    throw new Error('Failed to delete resume')
  }

  revalidatePath('/student/resume')
}
