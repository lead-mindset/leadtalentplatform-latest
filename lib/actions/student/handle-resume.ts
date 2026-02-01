'use server'

import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function uploadResume(formData: FormData) {
  const { supabase, user } = await requireUser();

  const file = formData.get('resume') as File | null;
  if (!file) throw new Error('Resume file is required');
  if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed');

  const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) throw new Error('Upload failed');

  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(filePath);

  const now = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from('Resume')
    .upsert({
      studentId: user.id,
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: now,
    }, {
      onConflict: 'studentId',
    });

  if (upsertError) throw new Error('Failed to save resume');

  revalidatePath('/student/resume');
}