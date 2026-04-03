'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleSaveStudentAction(
  studentId: string,
  currentlySaved: boolean
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { success: false, isSaved: currentlySaved, error: 'Not authenticated' }

  if (currentlySaved) {
    const { error } = await supabase
      .from('SavedStudent')
      .delete()
      .eq('acceptedByUserId', authUser.id)
      .eq('studentId', studentId)

    if (error) {
      console.error('[toggleSaveStudentAction] Delete error:', error)
      return { success: false, isSaved: true, error: 'Failed to unsave student' }
    }

    revalidatePath('/company')
    revalidatePath('/company/browse')
    revalidatePath('/company/saved')
    revalidatePath(`/company/students/${studentId}`)
    return { success: true, isSaved: false }
  } else {
    const { error } = await supabase
      .from('SavedStudent')
      .insert({
        acceptedByUserId: authUser.id,
        studentId,
        savedAt: new Date().toISOString(),
        notes: null,
      })

    if (error) {
      console.error('[toggleSaveStudentAction] Insert error:', error)
      return { success: false, isSaved: false, error: 'Failed to save student' }
    }

    revalidatePath('/company')
    revalidatePath('/company/browse')
    revalidatePath('/company/saved')
    revalidatePath(`/company/students/${studentId}`)
    return { success: true, isSaved: true }
  }
}