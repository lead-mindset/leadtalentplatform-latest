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

export async function revokeApproval(userId: string, revokerId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== revokerId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: revoker, error: revokerError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', revokerId)
      .single()

    if (revokerError || !revoker) {
      return { success: false, error: 'User not found' }
    }

    if (revoker.role !== 'admin' && revoker.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can revoke approval' }
    }

    if (revoker.role === 'editor') {
      const { data: revokerProfile, error: revokerProfileError } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', revokerId)
        .single()

      if (revokerProfileError || !revokerProfile) {
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

      if (memberProfile.chapterId !== revokerProfile.chapterId) {
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
      console.error('[revokeApproval] Error:', updateError)
      return { success: false, error: 'Failed to revoke approval' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath(`/admin/chapters`)
    
    return { success: true }
  } catch (error) {
    console.error('[revokeApproval] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
