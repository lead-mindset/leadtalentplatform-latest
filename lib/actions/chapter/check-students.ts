'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveMember(userId: string, approverId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== approverId) {
      return { success: false, error: 'Unauthorized' }
    }
    const { data: approver, error: approverError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', approverId)
      .single()

    if (approverError || !approver) {
      return { success: false, error: 'User not found' }
    }
    // Admins can approve anyone, editors can only approve in their chapter
    if (approver.role !== 'admin' && approver.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can approve members' }
    }

    // If editor, verify same chapter
    if (approver.role === 'editor') {
      const { data: approverProfile, error: approverProfileError } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', approverId)
        .single()

      if (approverProfileError || !approverProfile) {
        return { success: false, error: 'Editor must have a chapter assignment' }
      }

      const { data: memberProfile, error: memberProfileError } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', userId)
        .single()

      if (memberProfileError || !memberProfile) {
        return { success: false, error: 'Member profile not found' }
      }

      if (memberProfile.chapterId !== approverProfile.chapterId) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('StudentProfile')
      .select('isFilled')
      .eq('userId', userId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Member profile not found' }
    }

    if (!profile.isFilled) {
      return { success: false, error: 'Cannot approve incomplete profile' }
    }

    const { error: updateError } = await supabase
      .from('StudentProfile')
      .update({ 
        approvedById: approverId,
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
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath(`/admin/chapters`)
    
    return { success: true }
  } catch (error) {
    console.error('[approveMember] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rejectMember(userId: string, rejecterId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== rejecterId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: rejecter, error: rejecterError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', rejecterId)
      .single()

    if (rejecterError || !rejecter) {
      return { success: false, error: 'User not found' }
    }

    // Admins can reject anyone, editors can only reject in their chapter
    if (rejecter.role !== 'admin' && rejecter.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can reject members' }
    }

    if (rejecter.role === 'editor') {
      const { data: rejecterProfile, error: rejecterProfileError } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', rejecterId)
        .single()

      if (rejecterProfileError || !rejecterProfile) {
        return { success: false, error: 'Editor must have a chapter assignment' }
      }

      const { data: memberProfile, error: memberProfileError } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', userId)
        .single()

      if (memberProfileError || !memberProfile) {
        return { success: false, error: 'Member profile not found' }
      }

      if (memberProfile.chapterId !== rejecterProfile.chapterId) {
        return { success: false, error: 'Member not in your chapter' }
      }
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
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath(`/admin/chapters`)
    
    return { success: true }
  } catch (error) {
    console.error('[rejectMember] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}