import { logger } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import type { ChapterRow, MemberWithProfile } from '@/lib/types'
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service'
import type { ChapterPermissionKey } from '@/lib/services/chapter-permission.service'

/**
 * Service Layer: Chapter Member Management
 *
 * All member approval/rejection/revocation operations.
 * Keeps Server Actions thin â€” auth stays in actions, DB logic lives here.
 */

type ApprovalResult = { success: true; member_id: string } | { success: false; error: string }
export type ChapterMemberPermissionFlags = {
  canViewApproved: boolean
  canViewAlumni: boolean
  canViewMemberContact: boolean
  canViewApplicants: boolean
  canViewRejected: boolean
  canViewInactive: boolean
  canManageApplications: boolean
  canRevokeMembers: boolean
  canAssignEboard: boolean
}

const CHAPTER_SELECT = 'id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point'
const permissionKeySet = (permissionKeys: readonly ChapterPermissionKey[]) => new Set(permissionKeys)

export function getChapterMemberPermissionFlags(
  permissionKeys: readonly ChapterPermissionKey[]
): ChapterMemberPermissionFlags {
  const permissions = permissionKeySet(permissionKeys)

  return {
    canViewApproved: permissions.has('chapter.members.view_approved'),
    canViewAlumni: permissions.has('chapter.members.view_alumni'),
    canViewMemberContact: permissions.has('chapter.members.view_member_contact'),
    canViewApplicants: permissions.has('chapter.members.view_applicants'),
    canViewRejected: permissions.has('chapter.members.view_rejected'),
    canViewInactive: permissions.has('chapter.members.view_inactive'),
    canManageApplications: permissions.has('chapter.members.manage_applications'),
    canRevokeMembers: permissions.has('chapter.members.revoke'),
    canAssignEboard: permissions.has('chapter.roles.assign_eboard'),
  }
}

export function filterChapterMembersForPermissions(
  members: MemberWithProfile[],
  permissions: ChapterMemberPermissionFlags
): MemberWithProfile[] {
  return members.filter((member) => {
    const status = member.chapter_membership?.status

    if (status === 'approved') return permissions.canViewApproved
    if (status === 'alumni') return permissions.canViewAlumni
    if (status === 'pending') return permissions.canViewApplicants || permissions.canManageApplications
    if (status === 'rejected') return permissions.canViewRejected
    if (status === 'inactive') return permissions.canViewInactive

    return false
  })
}

export const ChapterService = {
  async getAllChapters(supabase: SupabaseClient<Database>): Promise<ChapterRow[]> {
    const { data, error } = await supabase
      .from('chapter')
      .select(CHAPTER_SELECT)
      .order('name', { ascending: true })

    if (error) {
      logger.error({ context: 'ChapterService.getAllChapters', error: error }, 'Error')
      return []
    }

    return data || []
  },

  async getChapterById(supabase: SupabaseClient<Database>, id: string): Promise<ChapterRow | null> {
    const { data, error } = await supabase
      .from('chapter')
      .select(CHAPTER_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      logger.error({ context: 'ChapterService.getChapterById', error: error }, 'Error')
      return null
    }

    return data
  },

  async getChapterMembers(
    supabase: SupabaseClient<Database>,
    chapter_id: string
  ): Promise<MemberWithProfile[]> {
    const members = await ChapterMembershipService.getChapterRoster(supabase, chapter_id)
    return members.filter((member: MemberWithProfile) => member.role === 'member' || member.role === 'editor')
  },

  getMemberStats(members: MemberWithProfile[]) {
    const incomplete = members.filter((member: MemberWithProfile) => !member.person_profile)
    const pending = members.filter(
      (member: MemberWithProfile) => member.person_profile && member.chapter_membership?.status === 'pending'
    )
    const approved = members.filter(
      (member: MemberWithProfile) => member.chapter_membership?.status === 'approved'
    )
    const rejected = members.filter(
      (member: MemberWithProfile) => member.chapter_membership?.status === 'rejected'
    )
    const inactive = members.filter(
      (member: MemberWithProfile) => member.chapter_membership?.status === 'inactive'
    )
    const alumni = members.filter(
      (member: MemberWithProfile) => member.chapter_membership?.status === 'alumni'
    )

    return {
      total: members.length,
      incomplete: incomplete.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      inactive: inactive.length,
      alumni: alumni.length,
      pending_members: pending,
      approved_members: approved,
      rejected_members: rejected,
      inactive_members: inactive,
      alumni_members: alumni,
      complete_profiles: members.filter((member: MemberWithProfile) => member.person_profile).length,
      visible_to_recruiters: members.filter((member: MemberWithProfile) => member.person_profile?.is_recruiter_visible).length,
    }
  },

  async getRecentChapterActivity(
    supabase: SupabaseClient<Database>,
    chapter_id: string,
    limit: number = 5
  ): Promise<MemberWithProfile[]> {
    const members = await ChapterMembershipService.getChapterRoster(supabase, chapter_id)

    return ChapterService.getRecentChapterActivityFromMembers(members, limit)
  },

  getRecentChapterActivityFromMembers(
    members: MemberWithProfile[],
    limit: number = 5
  ): MemberWithProfile[] {
    return members
      .filter((member) => member.chapter_membership?.status === 'approved')
      .sort((a, b) => {
        const aUpdated = a.person_profile?.updated_at
          ? new Date(a.person_profile.updated_at).getTime()
          : 0
        const bUpdated = b.person_profile?.updated_at
          ? new Date(b.person_profile.updated_at).getTime()
          : 0

        return bUpdated - aUpdated
      })
      .slice(0, limit)
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /**
   * Approve a single member.
   * Validates profile is complete, generates a unique member ID,
   * and updates the chapter_membership row.
   */
  async approveMember(
    supabase: SupabaseClient<Database>,
    userId: string,
    approverId: string,
    chapterId?: string | null
  ): Promise<ApprovalResult> {
    // 1. Verify profile exists
    const { data: profile, error: profileError } = await supabase
      .from('person_profile')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found' }
    }

    if (!chapterId) {
      return { success: false, error: 'Membership application not found.' }
    }

    return ChapterMembershipService.approveMembership(supabase, {
      userId,
      chapterId,
      approverId,
      generateMemberId: generateUniqueMemberId,
    })
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
      .from('chapter_membership')
      .select('user_id, chapter_id, status')
      .in('user_id', uniqueUserIds)

    if (candidatesError || !candidates) {
      return { success: false, count: 0, skipped: 0, errors: [{ user_id: '', error: 'Failed to load selected members' }] }
    }

    const eligibleCandidates = candidates
      .filter((membership) => (membership.status ?? 'pending') === 'pending')
      .filter((membership) => !approverChapterId || membership.chapter_id === approverChapterId)

    if (eligibleCandidates.length === 0) {
      return { success: false, count: 0, skipped: 0, errors: [{ user_id: '', error: 'No eligible members selected' }] }
    }

    const eligibleUserIds = eligibleCandidates.map((membership) => membership.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from('person_profile')
      .select('user_id')
      .in('user_id', eligibleUserIds)

    if (profilesError || !profiles) {
      return { success: false, count: 0, skipped: 0, errors: [{ user_id: '', error: 'Failed to load selected profiles' }] }
    }

    const profileUserIds = new Set(profiles.map((profile) => profile.user_id))
    const validUserIds = eligibleCandidates
      .filter((membership) => profileUserIds.has(membership.user_id))
      .map((membership) => membership.user_id)

    if (validUserIds.length === 0) {
      return { success: false, count: 0, skipped: 0, errors: [{ user_id: '', error: 'No eligible members selected' }] }
    }

    const results: Array<{ user_id: string; member_id: string }> = []
    const errors: Array<{ user_id: string; error: string }> = []

    for (const user_id of validUserIds) {
      const membership = candidates.find((candidate) => candidate.user_id === user_id)
      const result = await this.approveMember(supabase, user_id, approverId, membership?.chapter_id)
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
   * Sets membership status to 'rejected' and clears member_id / visibility.
   */
  async rejectMember(
    supabase: SupabaseClient<Database>,
    userId: string,
    managerId: string,
    chapterId?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    if (!chapterId) {
      return { success: false, error: 'Membership application not found.' }
    }

    return ChapterMembershipService.rejectMembership(supabase, {
      userId,
      chapterId,
      managerId,
    })
  },

  /**
   * Revoke approval.
   * Resets membership status to 'pending' and clears member_id / visibility.
   */
  async revokeApproval(
    supabase: SupabaseClient<Database>,
    userId: string,
    managerId: string,
    chapterId: string | null,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!chapterId) {
      return { success: false, error: 'Membership application not found.' }
    }

    return ChapterMembershipService.revokeMembership(supabase, {
      userId,
      chapterId,
      managerId,
      reason,
    })
  },

  /**
   * Get a student's chapter_id from their profile.
   */
  async getStudentChapterId(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<string | null> {
    const { data: membership, error } = await supabase
      .from('chapter_membership')
      .select('chapter_id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()

    if (error || !membership) {
      return null
    }

    return membership.chapter_id ?? null
  },

  async getPendingMembershipChapterId(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<string | null> {
    const { data: membership, error } = await supabase
      .from('chapter_membership')
      .select('chapter_id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error || !membership) {
      return null
    }

    return membership.chapter_id ?? null
  },

  /**
   * Get basic user info (email, name) by ID.
   */
  async getUserBasicInfo(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<{ email: string; name: string | null } | null> {
    const { data, error } = await supabase
      .from('user')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return { email: data.email, name: data.name }
  },

  /**
   * Get chapter name by ID.
   */
  async getChapterName(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('chapter')
      .select('name')
      .eq('id', chapterId)
      .single()

    if (error || !data) {
      return null
    }

    return data.name ?? null
  },
}
