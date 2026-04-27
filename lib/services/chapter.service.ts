import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import type { ChapterRow, MemberWithProfile, StudentProfileRow, UserRow } from '@/lib/types'

/**
 * Service Layer: Chapter Member Management
 *
 * All member approval/rejection/revocation operations.
 * Keeps Server Actions thin — auth stays in actions, DB logic lives here.
 */

type ApprovalResult = { success: true; member_id: string } | { success: false; error: string }

const PROFILE_SELECT = `
  user_id,
  major,
  graduation_year,
  linkedin_url,
  skills,
  consent_recruiter_visibility,
  is_recruiter_visible,
  approved_by_id,
  approval_status,
  is_filled,
  updated_at,
  created_at,
  consent_date,
  chapter_id,
  email_notifications_enabled,
  gender,
  member_id,
  chapter:chapter!student_profile_chapter_id_fkey (
    id,
    name,
    university,
    city,
    region,
    created_at,
    updated_at
  )
`

type ChapterProfileRow = Pick<
  StudentProfileRow,
  | 'user_id'
  | 'major'
  | 'graduation_year'
  | 'linkedin_url'
  | 'skills'
  | 'consent_recruiter_visibility'
  | 'is_recruiter_visible'
  | 'approved_by_id'
  | 'approval_status'
  | 'is_filled'
  | 'updated_at'
  | 'created_at'
  | 'consent_date'
  | 'chapter_id'
  | 'email_notifications_enabled'
  | 'gender'
  | 'member_id'
> & {
  user:
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>[]
  chapter: ChapterRow | ChapterRow[] | null
}

function mapProfile(profile: ChapterProfileRow): MemberWithProfile | null {
  const user = Array.isArray(profile.user) ? profile.user[0] : profile.user
  const chapter = Array.isArray(profile.chapter) ? profile.chapter[0] : profile.chapter

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    phone: user.phone ?? null,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    deactivated_at: user.deactivated_at,
    student_profile: {
      user_id: profile.user_id,
      major: profile.major,
      graduation_year: profile.graduation_year,
      linkedin_url: profile.linkedin_url,
      skills: profile.skills,
      consent_recruiter_visibility: profile.consent_recruiter_visibility,
      is_recruiter_visible: profile.is_recruiter_visible,
      approved_by_id: profile.approved_by_id,
      approval_status: profile.approval_status,
      is_filled: profile.is_filled,
      updated_at: profile.updated_at,
      created_at: profile.created_at,
      consent_date: profile.consent_date,
      chapter_id: profile.chapter_id,
      email_notifications_enabled: profile.email_notifications_enabled,
      gender: profile.gender,
      member_id: profile.member_id,
    },
    chapter: chapter ?? null,
  }
}

const CHAPTER_SELECT = 'id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point'

export const ChapterService = {
  async getAllChapters(supabase: SupabaseClient<Database>): Promise<ChapterRow[]> {
    const { data, error } = await supabase
      .from('chapter')
      .select(CHAPTER_SELECT)
      .order('name', { ascending: true })

    if (error) {
      console.error('[ChapterService.getAllChapters] Error:', error)
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
      console.error('[ChapterService.getChapterById] Error:', error)
      return null
    }

    return data
  },

  async getChapterMembers(
    supabase: SupabaseClient<Database>,
    chapter_id: string
  ): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from('student_profile')
      .select(PROFILE_SELECT)
      .eq('chapter_id', chapter_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ChapterService.getChapterMembers] Error:', error)
      return []
    }

    const rows = (data ?? []) as ChapterProfileRow[]

    return rows
      .map(mapProfile)
      .filter((m): m is MemberWithProfile => m !== null)
      .filter((member: MemberWithProfile) => member.role === 'member' || member.role === 'editor')
  },

  getMemberStats(members: MemberWithProfile[]) {
    const incomplete = members.filter((member: MemberWithProfile) => !member.student_profile?.is_filled)
    const pending = members.filter(
      (member: MemberWithProfile) => member.student_profile?.is_filled && member.student_profile?.approval_status === 'pending'
    )
    const approved = members.filter(
      (member: MemberWithProfile) => member.student_profile?.approval_status === 'approved'
    )
    const rejected = members.filter(
      (member: MemberWithProfile) => member.student_profile?.approval_status === 'rejected'
    )

    return {
      total: members.length,
      incomplete: incomplete.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      pending_members: pending,
      approved_members: approved,
      rejected_members: rejected,
      complete_profiles: members.filter((member: MemberWithProfile) => member.student_profile?.is_filled).length,
      visible_to_recruiters: members.filter((member: MemberWithProfile) => member.student_profile?.is_recruiter_visible).length,
    }
  },

  async getRecentChapterActivity(
    supabase: SupabaseClient<Database>,
    chapter_id: string,
    limit: number = 5
  ): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from('student_profile')
      .select(PROFILE_SELECT)
      .eq('chapter_id', chapter_id)
      .eq('approval_status', 'approved')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      console.error('[ChapterService.getRecentChapterActivity] Error:', error)
      return []
    }

    return (data as ChapterProfileRow[])
      .map(mapProfile)
      .filter((m): m is MemberWithProfile => m !== null)
  },

  // ───────────────────────────────────────────────────────────────
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

  /**
   * Get a student's chapter_id from their profile.
   */
  async getStudentChapterId(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<string | null> {
    const { data: profile, error } = await supabase
      .from('student_profile')
      .select('chapter_id')
      .eq('user_id', userId)
      .single()

    if (error || !profile) {
      return null
    }

    return profile.chapter_id ?? null
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
