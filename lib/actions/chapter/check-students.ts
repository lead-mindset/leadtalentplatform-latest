'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import { sendMemberApprovalEmail } from '@/lib/emails/send-email'
import type { StudentProfileRow } from '@/lib/types'

type ApprovalCandidateRow = Pick<StudentProfileRow, 'userId' | 'chapterId' | 'isFilled'>

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

    if (approver.role !== 'admin' && approver.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can approve members' }
    }

    if (approver.role === 'editor') {
      const { data: approverProfile } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', approverId)
        .single()

      const { data: memberProfile } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', userId)
        .single()

      if (!approverProfile || !memberProfile || memberProfile.chapterId !== approverProfile.chapterId) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }

    const { data: profile } = await supabase
      .from('StudentProfile')
      .select('isFilled, chapterId')
      .eq('userId', userId)
      .single()

    if (!profile?.isFilled) {
      return { success: false, error: 'Cannot approve incomplete profile' }
    }

    // Generate unique member ID with retry logic
    let memberId: string
    try {
      memberId = await generateUniqueMemberId(supabase)
    } catch (error) {
      console.error('Member ID generation failed:', error)
      return {
        success: false,
        error: 'Could not generate a member ID - please try again.',
      }
    }

    const { error: updateError } = await supabase
      .from('StudentProfile')
      .update({ 
        approvedById: approverId,
        approvalStatus: 'approved',
        memberId: memberId,
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
    revalidatePath('/admin/chapters')
    
    const { data: userData } = await supabase
      .from('User')
      .select('email, name')
      .eq('id', userId)
      .single()
    
    const { data: chapterData } = await supabase
      .from('Chapter')
      .select('name')
      .eq('id', profile?.chapterId || '')
      .single()
    
    if (userData?.email && chapterData?.name) {
      sendMemberApprovalEmail(
        userData.email,
        userData.name || userData.email.split('@')[0],
        memberId,
        chapterData.name
      ).catch(err => console.error('Failed to send member approval email:', err))
    }
    
    return { success: true, memberId: memberId }
  } catch (error) {
    console.error('[approveMember] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function approveMembersBulk(userIds: string[], approverId: string) {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { success: false, error: 'No members selected' }
    }

    const uniqueUserIds = [...new Set(userIds)]
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

    if (approver.role !== 'admin' && approver.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can approve members' }
    }

    let chapterId: string | null = null
    if (approver.role === 'editor') {
      const { data: approverProfile } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', approverId)
        .single()

      chapterId = approverProfile?.chapterId ?? null
      if (!chapterId) return { success: false, error: 'No chapter assigned' }
    }

    const { data: candidates, error: candidatesError } = await supabase
      .from('StudentProfile')
      .select('userId, chapterId, isFilled')
      .in('userId', uniqueUserIds)

    if (candidatesError || !candidates) {
      return { success: false, error: 'Failed to load selected members' }
    }

    const validUserIds = (candidates as ApprovalCandidateRow[])
      .filter((profile) => profile.isFilled)
      .filter((profile) => !chapterId || profile.chapterId === chapterId)
      .map((profile) => profile.userId)

    if (validUserIds.length === 0) {
      return { success: false, error: 'No eligible members selected' }
    }

    const results = []
    const errors = []

    for (const userId of validUserIds) {
      try {
        let memberId: string
        try {
          memberId = await generateUniqueMemberId(supabase)
        } catch (error) {
          console.error('Member ID generation failed for user:', userId, error)
          errors.push({ userId, error: 'Could not generate member ID' })
          continue
        }

        const { error: updateError } = await supabase
          .from('StudentProfile')
          .update({
            approvedById: approverId,
            approvalStatus: 'approved',
            memberId: memberId,
            isRecruiterVisible: true,
            updatedAt: new Date().toISOString(),
          })
          .eq('userId', userId)

        if (updateError) {
          console.error('Failed to approve member:', userId, updateError)
          errors.push({ userId, error: 'Failed to approve member' })
        } else {
          results.push({ userId, memberId, success: true })
        }
      } catch (error) {
        errors.push({ userId, error: 'Failed to process' })
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
    console.error('[approveMembersBulk] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rejectMember(userId: string, rejecterId: string, _reason?: string) {
  try {
    void _reason
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

    if (rejecter.role !== 'admin' && rejecter.role !== 'editor') {
      return { success: false, error: 'Only admins and editors can reject members' }
    }

    if (rejecter.role === 'editor') {
      const { data: rejecterProfile } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', rejecterId)
        .single()

      const { data: memberProfile } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', userId)
        .single()

      if (!rejecterProfile || !memberProfile || memberProfile.chapterId !== rejecterProfile.chapterId) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }

    const { error: updateError } = await supabase
      .from('StudentProfile')
      .update({ 
        approvalStatus: 'rejected',
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
    revalidatePath('/admin/chapters')
    
    return { success: true }
  } catch (error) {
    console.error('[rejectMember] Unexpected error:', error)
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
      const { data: revokerProfile } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', revokerId)
        .single()

      const { data: memberProfile } = await supabase
        .from('StudentProfile')
        .select('chapterId')
        .eq('userId', userId)
        .single()

      if (!revokerProfile || !memberProfile || memberProfile.chapterId !== revokerProfile.chapterId) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }

    const { error: updateError } = await supabase
      .from('StudentProfile')
      .update({ 
        approvedById: null,
        approvalStatus: 'pending',
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
    revalidatePath('/admin/chapters')
    
    return { success: true }
  } catch (error) {
    console.error('[revokeApproval] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
