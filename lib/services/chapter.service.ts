import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import { generateUniqueMemberId } from '@/lib/utils/member-id'

/**
 * Service Layer: Chapter Member Management
 *
 * All member approval/rejection/revocation operations.
 * Keeps Server Actions thin — auth stays in actions, DB logic lives here.
 */

type ApprovalResult = { success: true; member_id: string } | { success: false; error: string }

export const ChapterService = {
  /**
   * Approve a single member.
   * Validates profile is complete, generates a unique member ID,
   * and updates the student_profile row.
   */
  async approveMember(
    supabase: SupabaseClient<Database>,
    userId: string,
    approverId: string
  ): Promise<ApprovalResult> {
    // 1. Verify profile is filled
    const { data: profile, error: profileError } = await supabase
      .from('student_profile')
      .select('is_filled, chapter_id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found' }
    }

    if (!profile.is_filled) {
      return { success: false, error: 'Cannot approve incomplete profile' }
    }

    // 2. Generate unique member ID
    let memberId: string
    try {
      memberId = await generateUniqueMemberId(supabase)
    } catch {
      return { success: false, error: 'Could not generate a member ID — please try again.' }
    }

    // 3. Update profile
    const { error: updateError } = await supabase
      .from('student_profile')
      .update({
        approved_by_id: approverId,
        approval_status: 'approved',
        member_id: memberId,
        is_recruiter_visible: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to approve member' }
    }

    return { success: true, member_id: memberId }
  },

  /**
   * Bulk approve members.
   * Filters to eligible members (filled profile, same chapter if applicable),
   * generates member IDs, and updates each profile.
   */
  async approveMembersBulk(
    supabase: SupabaseClient<Database>,
    userIds: string[],
    approverId: string,
    approverChapterId: string | null
  ): Promise<{
    success: boolean
    count: number
    skipped: number
    errors?: Array<{ user_id: string; error: string }>
  }> {
    const uniqueUserIds = [...new Set(userIds)]

    const { data: candidates, error: candidatesError } = await supabase
      .from('student_profile')
      .select('user_id, chapter_id, is_filled')
      .in('user_id', uniqueUserIds)

    if (candidatesError || !candidates) {
      return { success: false, count: 0, skipped: 0, errors: [{ user_id: '', error: 'Failed to load selected members' }] }
    }

    const validUserIds = candidates
      .filter((profile) => profile.is_filled)
      .filter((profile) => !approverChapterId || profile.chapter_id === approverChapterId)
      .map((profile) => profile.user_id)

    if (validUserIds.length === 0) {
      return { success: false, count: 0, skipped: 0, errors: [{ user_id: '', error: 'No eligible members selected' }] }
    }

    const results: Array<{ user_id: string; member_id: string }> = []
    const errors: Array<{ user_id: string; error: string }> = []

    for (const user_id of validUserIds) {
      const result = await this.approveMember(supabase, user_id, approverId)
      if (result.success) {
        results.push({ user_id, member_id: result.member_id })
      } else {
        errors.push({ user_id, error: result.error })
      }
    }

    const successCount = results.length
    const failureCount = errors.length
    const skippedCount = uniqueUserIds.length - validUserIds.length + failureCount

    return {
      success: failureCount === 0,
      count: successCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    }
  },

  /**
   * Reject a member.
   * Sets approval_status to 'rejected' and clears member_id / visibility.
   */
  async rejectMember(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error: updateError } = await supabase
      .from('student_profile')
      .update({
        approval_status: 'rejected',
        member_id: null,
        is_recruiter_visible: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to reject member' }
    }

    return { success: true }
  },

  /**
   * Revoke approval.
   * Resets approval_status to 'pending' and clears member_id / visibility.
   */
  async revokeApproval(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error: updateError } = await supabase
      .from('student_profile')
      .update({
        approved_by_id: null,
        approval_status: 'pending',
        member_id: null,
        is_recruiter_visible: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to revoke approval' }
    }

    return { success: true }
  },
}
