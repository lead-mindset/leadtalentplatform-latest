'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MemberWithProfile } from '@/lib/types'

export async function approveMember(userId: string, editorId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== editorId) {
      return { success: false, error: 'Unauthorized' }
    }
    const { data: editor, error: editorError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', editorId)
      .single()

    if (editorError || !editor || editor.role !== 'editor') {
      return { success: false, error: 'Only editors can approve members' }
    }

    const { data: editorProfile, error: editorProfileError } = await supabase
      .from('StudentProfile')
      .select('chapterId')
      .eq('userId', editorId)
      .single()

    if (editorProfileError || !editorProfile) {
      return { success: false, error: 'Editor must have a chapter assignment' }
    }

    const { data: memberProfile, error: memberProfileError } = await supabase
      .from('StudentProfile')
      .select('chapterId, isFilled')
      .eq('userId', userId)
      .single()

    if (memberProfileError || !memberProfile) {
      return { success: false, error: 'Member profile not found' }
    }
    if (memberProfile.chapterId !== editorProfile.chapterId) {
      return { success: false, error: 'Member not in your chapter' }
    }

    // Verify profile is filled before approving
    if (!memberProfile.isFilled) {
      return { success: false, error: 'Cannot approve incomplete profile' }
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
      console.error('[approveMember] Error:', updateError)
      return { success: false, error: 'Failed to approve member' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    
    return { success: true }
  } catch (error) {
    console.error('[approveMember] Unexpected error:', error)
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

    const { data: editor, error: editorError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (editorError || !editor || editor.role !== 'editor') {
      return { success: false, error: 'Only editors can reject members' }
    }

    // Get editor's chapter from their StudentProfile
    const { data: editorProfile, error: editorProfileError } = await supabase
      .from('StudentProfile')
      .select('chapterId')
      .eq('userId', user.id)
      .single()

    if (editorProfileError || !editorProfile) {
      return { success: false, error: 'Editor must have a chapter assignment' }
    }

    // Get member's chapter from their StudentProfile
    const { data: memberProfile, error: memberProfileError } = await supabase
      .from('StudentProfile')
      .select('chapterId')
      .eq('userId', userId)
      .single()

    if (memberProfileError || !memberProfile) {
      return { success: false, error: 'Member profile not found' }
    }
    if (memberProfile.chapterId !== editorProfile.chapterId) {
      return { success: false, error: 'Member not in your chapter' }
    }

    const { error: updateError } = await supabase
      .from('StudentProfile')
      .update({ 
        approvedById: null,
        isRecruiterVisible: false,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId)

    if (updateError) {
      console.error('[rejectMember] Error:', updateError)
      return { success: false, error: 'Failed to reject member' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    
    return { success: true }
  } catch (error) {
    console.error('[rejectMember] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}


