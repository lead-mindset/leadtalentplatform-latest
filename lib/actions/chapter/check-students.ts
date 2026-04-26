'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import { sendMemberApprovalEmail } from '@/lib/emails/send-email'
import type { StudentProfileRow } from '@/lib/types'

type ApprovalCandidateRow = Pick<StudentProfileRow, 'user_id' | 'chapter_id' | 'is_filled'>

export async function approveMember(user_id: string, approverId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== approverId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: approver, error: approverError } = await supabase
      .from('user')
      .select('id, role')
      .eq('id', approverId)
      .single()

    if (approverError || !approver) {
      return { success: false, error: 'User not found' }
    }

    if (approver.role !== 'admin' && approver.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can approve members' }
    }

    if (approver.role === 'editor') {
      const { data: approverProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', approverId)
        .single()

      const { data: memberProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', user_id)
        .single()

      if (!approverProfile || !memberProfile || memberProfile.chapter_id !== approverProfile.chapter_id) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }

    const { data: profile } = await supabase
      .from('student_profile')
      .select('is_filled, chapter_id')
      .eq('user_id', user_id)
      .single()

    if (!profile?.is_filled) {
      return { success: false, error: 'Cannot approve incomplete profile' }
    }

    // Generate unique member ID with retry logic
    let member_id: string
    try {
      member_id = await generateUniqueMemberId(supabase)
    } catch (error) {
      return {
        success: false,
        error: 'Could not generate a member ID - please try again.',
      }
    }

    const { error: updateError } = await supabase
      .from('student_profile')
      .update({ 
        approved_by_id: approverId,
        approval_status: 'approved',
        member_id: member_id,
        is_recruiter_visible: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    if (updateError) {
      return { success: false, error: 'Failed to approve member' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${user_id}`)
    revalidatePath('/admin/chapters')
    
    const { data: userData } = await supabase
      .from('user')
      .select('email, name')
      .eq('id', user_id)
      .single()
    
    const { data: chapterData } = await supabase
      .from('chapter')
      .select('name')
      .eq('id', profile?.chapter_id || '')
      .single()
    
    if (userData?.email && chapterData?.name) {
      sendMemberApprovalEmail(
        userData.email,
        userData.name || userData.email.split('@')[0],
        member_id,
        chapterData.name
      ).catch(() => {}) // Silently fail email sending
    }
    
    return { success: true, member_id: member_id }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function approveMembersBulk(user_ids: string[], approverId: string) {
  try {
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return { success: false, error: 'No members selected' }
    }

    const uniqueUserIds = [...new Set(user_ids)]
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== approverId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: approver, error: approverError } = await supabase
      .from('user')
      .select('id, role')
      .eq('id', approverId)
      .single()

    if (approverError || !approver) {
      return { success: false, error: 'User not found' }
    }

    if (approver.role !== 'admin' && approver.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can approve members' }
    }

    let chapter_id: string | null = null
    if (approver.role === 'editor') {
      const { data: approverProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', approverId)
        .single()

      chapter_id = approverProfile?.chapter_id ?? null
      if (!chapter_id) return { success: false, error: 'No chapter assigned' }
    }

    const { data: candidates, error: candidatesError } = await supabase
      .from('student_profile')
      .select('user_id, chapter_id, is_filled')
      .in('user_id', uniqueUserIds)

    if (candidatesError || !candidates) {
      return { success: false, error: 'Failed to load selected members' }
    }

    const validUserIds = (candidates as ApprovalCandidateRow[])
      .filter((profile) => profile.is_filled)
      .filter((profile) => !chapter_id || profile.chapter_id === chapter_id)
      .map((profile) => profile.user_id)

    if (validUserIds.length === 0) {
      return { success: false, error: 'No eligible members selected' }
    }

    const results = []
    const errors = []

    for (const user_id of validUserIds) {
      try {
        let member_id: string
        try {
          member_id = await generateUniqueMemberId(supabase)
        } catch (error) {
          errors.push({ user_id, error: 'Could not generate member ID' })
          continue
        }

        const { error: updateError } = await supabase
          .from('student_profile')
          .update({
            approved_by_id: approverId,
            approval_status: 'approved',
            member_id: member_id,
            is_recruiter_visible: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user_id)

        if (updateError) {
          errors.push({ user_id, error: 'Failed to approve member' })
        } else {
          results.push({ user_id, member_id, success: true })
        }
      } catch (error) {
        errors.push({ user_id, error: 'Failed to process' })
      }
    }

    const successCount = results.length
    const failureCount = errors.length

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    revalidatePath('/admin/users')
    revalidatePath('/admin/chapters')

    return {
      success: failureCount === 0,
      count: successCount,
      skipped: uniqueUserIds.length - validUserIds.length + failureCount,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rejectMember(user_id: string, rejecterId: string, _reason?: string) {
  try {
    void _reason
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== rejecterId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: rejecter, error: rejecterError } = await supabase
      .from('user')
      .select('id, role')
      .eq('id', rejecterId)
      .single()

    if (rejecterError || !rejecter) {
      return { success: false, error: 'User not found' }
    }

    if (rejecter.role !== 'admin' && rejecter.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can reject members' }
    }

    if (rejecter.role === 'editor') {
      const { data: rejecterProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', rejecterId)
        .single()

      const { data: memberProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', user_id)
        .single()

      if (!rejecterProfile || !memberProfile || memberProfile.chapter_id !== rejecterProfile.chapter_id) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }

    const { error: updateError } = await supabase
      .from('student_profile')
      .update({ 
        approval_status: 'rejected',
        member_id: null,
        is_recruiter_visible: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    if (updateError) {
      return { success: false, error: 'Failed to reject member' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${user_id}`)
    revalidatePath('/admin/chapters')
    
    return { success: true }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function revokeApproval(user_id: string, revokerId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== revokerId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: revoker, error: revokerError } = await supabase
      .from('user')
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
      const { data: revokerProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', revokerId)
        .single()

      const { data: memberProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', user_id)
        .single()

      if (!revokerProfile || !memberProfile || memberProfile.chapter_id !== revokerProfile.chapter_id) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }

    const { error: updateError } = await supabase
      .from('student_profile')
      .update({ 
        approved_by_id: null,
        approval_status: 'pending',
        member_id: null,
        is_recruiter_visible: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    if (updateError) {
      return { success: false, error: 'Failed to revoke approval' }
    }

    revalidatePath('/chapter/members')
    revalidatePath('/chapter')
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${user_id}`)
    revalidatePath('/admin/chapters')
    
    return { success: true }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}
