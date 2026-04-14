'use server'

import { revalidatePath } from 'next/cache'
import { requireRecruiter } from '@/lib/auth'
import { toggleSaveStudent } from './get-data'

export async function toggleSaveStudentAction(
  studentId: string,
  currentlySaved: boolean
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  const { supabase, user } = await requireRecruiter()

  const result = await toggleSaveStudent(supabase, user.id, studentId)
  if (!result.success) {
    return { success: false, isSaved: currentlySaved, error: result.error }
  }

  revalidatePath('/company')
  revalidatePath('/company/browse')
  revalidatePath('/company/saved')
  revalidatePath(`/company/students/${studentId}`)
  revalidatePath('/recruiter/browse')
  revalidatePath('/recruiter/saved')

  return result
}
