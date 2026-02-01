'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveMember(userId: string, editorId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== editorId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: editor } = await supabase
      .from('User')
      .select('role, chapterId')
      .eq('id', editorId)
      .single()

    if (!editor || editor.role !== 'editor') {
      return { success: false, error: 'Only editors can approve members' }
    }

    const { data: member } = await supabase
      .from('User')
      .select('chapterId')
      .eq('id', userId)
      .single()

    if (!member || member.chapterId !== editor.chapterId) {
      return { success: false, error: 'Member not in your chapter' }
    }

    const { error: updateError } = await supabase
      .from('StudentProfile')
      .update({ 
        approvedById: editorId,
        isRecruiterVisible: true,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId)

    if (updateError) {
      console.error('Error approving member:', updateError)
      return { success: false, error: 'Failed to approve member' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rejectMember(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: editor } = await supabase
      .from('User')
      .select('role, chapterId')
      .eq('id', user.id)
      .single()

    if (!editor || editor.role !== 'editor') {
      return { success: false, error: 'Only editors can reject members' }
    }

    const { data: member } = await supabase
      .from('User')
      .select('chapterId')
      .eq('id', userId)
      .single()

    if (!member || member.chapterId !== editor.chapterId) {
      return { success: false, error: 'Member not in your chapter' }
    }

    const { error: updateError } = await supabase
      .from('StudentProfile')
      .update({ 
        approvedById: null,
        isRecruiterVisible: false,
        isFilled: false,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId)

    if (updateError) {
      console.error('Error rejecting member:', updateError)
      return { success: false, error: 'Failed to reject member' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}