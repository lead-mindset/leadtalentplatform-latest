import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type {
  ChapterMembershipRow,
  ChapterRow,
  MemberWithProfile,
  PersonProfileRow,
} from '@/lib/types'

type ActionResult = { success: true } | { success: false; error: string }
type ApprovalResult = { success: true; member_id: string } | { success: false; error: string }

type MembershipPosition =
  | 'member'
  | 'president'
  | 'vice_president'
  | 'secretary'
  | 'treasurer'
  | 'events_lead'
  | 'marketing_lead'
  | 'editor'

type ApplyToChapterParams = {
  userId: string
  chapterId: string
  position?: MembershipPosition
}

type MembershipTarget = {
  userId: string
  chapterId: string
}

type ApproveMembershipParams = MembershipTarget & {
  approverId: string
  generateMemberId: (supabase: SupabaseClient<Database>) => Promise<string>
}

type RejectMembershipParams = MembershipTarget & {
  managerId: string
}

type EditorEligibilityParams = {
  userId: string
  chapterId?: string
}

const CHAPTER_MANAGER_POSITIONS: MembershipPosition[] = [
  'editor',
  'president',
  'vice_president',
  'secretary',
  'treasurer',
]

function isOneApprovedMembershipError(error: { code?: string; message?: string } | null): boolean {
  return Boolean(
    error &&
      (error.code === '23505' ||
        error.message?.includes('idx_chapter_membership_one_approved_per_user'))
  )
}

function friendlyMembershipError(error: { code?: string; message?: string } | null): string {
  if (isOneApprovedMembershipError(error)) {
    return 'User already has an active approved chapter membership.'
  }

  return error?.message ?? 'Failed to update chapter membership.'
}

async function hasPersonProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('person_profile')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  return !error && Boolean(data)
}

async function canManageChapter(
  supabase: SupabaseClient<Database>,
  params: { managerId: string; chapterId: string }
): Promise<boolean> {
  const { data: manager, error: managerError } = await supabase
    .from('user')
    .select('id, role')
    .eq('id', params.managerId)
    .maybeSingle()

  if (managerError || !manager) return false
  if (manager.role === 'admin') return true
  if (manager.role !== 'editor') return false

  const { data: membership, error: membershipError } = await supabase
    .from('chapter_membership')
    .select('user_id')
    .match({
      user_id: params.managerId,
      chapter_id: params.chapterId,
      status: 'approved',
    })
    .in('position', CHAPTER_MANAGER_POSITIONS)
    .maybeSingle()

  return !membershipError && Boolean(membership)
}

export const ChapterMembershipService = {
  async applyToChapter(
    supabase: SupabaseClient<Database>,
    params: ApplyToChapterParams
  ): Promise<ActionResult> {
    const profileExists = await hasPersonProfile(supabase, params.userId)
    if (!profileExists) {
      return { success: false, error: 'Basic profile must be completed before applying to a chapter.' }
    }

    const { data: existingMembership, error: existingError } = await supabase
      .from('chapter_membership')
      .select('user_id, chapter_id, status')
      .match({ user_id: params.userId, chapter_id: params.chapterId })
      .maybeSingle()

    if (existingError) {
      return { success: false, error: friendlyMembershipError(existingError) }
    }

    if (existingMembership?.status === 'pending') {
      return { success: true }
    }

    if (existingMembership?.status === 'approved') {
      return { success: false, error: 'User already has an active approved chapter membership.' }
    }

    if (existingMembership?.status === 'alumni') {
      return { success: false, error: 'Alumni memberships cannot be reapplied through this flow.' }
    }

    const now = new Date().toISOString()

    if (existingMembership?.status === 'rejected') {
      const { error } = await supabase
        .from('chapter_membership')
        .update({
          status: 'pending',
          position: params.position ?? 'member',
          member_id: null,
          approved_by_id: null,
          updated_at: now,
        })
        .match({ user_id: params.userId, chapter_id: params.chapterId })

      if (error) {
        return { success: false, error: friendlyMembershipError(error) }
      }

      return { success: true }
    }

    const { error } = await supabase.from('chapter_membership').insert({
        user_id: params.userId,
        chapter_id: params.chapterId,
        status: 'pending',
        position: params.position ?? 'member',
        updated_at: now,
      })

    if (error) {
      return { success: false, error: friendlyMembershipError(error) }
    }

    return { success: true }
  },

  async getUserMemberships(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<ChapterMembershipRow[]> {
    const { data, error } = await supabase
      .from('chapter_membership')
      .select('*')
      .eq('user_id', userId)

    if (error) return []
    return data ?? []
  },

  async getChapterRoster(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<MemberWithProfile[]> {
    const { data: memberships, error } = await supabase
      .from('chapter_membership')
      .select('user_id, chapter_id, status, position, member_id, joined_at, created_at, updated_at')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })

    if (error || !memberships) return []

    const userIds = memberships.map((membership) => membership.user_id)
    if (userIds.length === 0) return []

    const [usersResult, profilesResult, chapterResult] = await Promise.all([
      supabase
        .from('user')
        .select('id, email, name, phone, role, created_at, updated_at, deactivated_at')
        .in('id', userIds),
      supabase
        .from('person_profile')
        .select(`
          user_id,
          id,
          university,
          major_or_interest,
          graduation_year,
          linkedin_url,
          portfolio_url,
          skills,
          gender,
          is_recruiter_visible,
          created_at,
          updated_at
        `)
        .in('user_id', userIds),
      supabase
        .from('chapter')
        .select(`
          id,
          name,
          university,
          city,
          region,
          created_at,
          updated_at,
          instagram_url,
          latitude,
          longitude,
          location_point
        `)
        .eq('id', chapterId)
        .maybeSingle(),
    ])

    if (usersResult.error) return []

    const usersById = new Map((usersResult.data ?? []).map((user) => [user.id, user]))
    const profilesByUserId = new Map(
      (profilesResult.data ?? []).map((profile) => [profile.user_id, profile])
    )
    const chapter = (chapterResult.data ?? null) as ChapterRow | null

    return memberships
      .map((membership): MemberWithProfile | null => {
        const user = usersById.get(membership.user_id)
        if (!user) return null

        return {
          ...user,
          person_profile: (profilesByUserId.get(membership.user_id) ?? null) as PersonProfileRow | null,
          chapter_membership: {
            chapter_id: membership.chapter_id,
            status: membership.status,
            position: membership.position,
            member_id: membership.member_id,
            joined_at: membership.joined_at,
          } as MemberWithProfile['chapter_membership'],
          chapter,
        }
      })
      .filter((member): member is MemberWithProfile => member !== null)
  },

  async approveMembership(
    supabase: SupabaseClient<Database>,
    params: ApproveMembershipParams
  ): Promise<ApprovalResult> {
    const canManage = await canManageChapter(supabase, {
      managerId: params.approverId,
      chapterId: params.chapterId,
    })

    if (!canManage) {
      return { success: false, error: 'Only admins and same-chapter editors can approve memberships.' }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('chapter_membership')
      .select('id, status, member_id')
      .match({ user_id: params.userId, chapter_id: params.chapterId })
      .maybeSingle()

    if (membershipError || !membership) {
      return { success: false, error: 'Membership application not found.' }
    }

    if (membership.status === 'approved' && membership.member_id) {
      return { success: true, member_id: membership.member_id }
    }

    if (membership.status !== 'pending') {
      return { success: false, error: 'Only pending memberships can be approved.' }
    }

    let memberId: string
    try {
      memberId = membership.member_id ?? await params.generateMemberId(supabase)
    } catch {
      return { success: false, error: 'Could not generate a member ID - please try again.' }
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('chapter_membership')
      .update({
        approved_by_id: params.approverId,
        status: 'approved',
        position: 'member',
        member_id: memberId,
        joined_at: now,
        updated_at: now,
      })
      .match({ user_id: params.userId, chapter_id: params.chapterId })

    if (updateError) {
      return { success: false, error: friendlyMembershipError(updateError) }
    }

    return { success: true, member_id: memberId }
  },

  async rejectMembership(
    supabase: SupabaseClient<Database>,
    params: RejectMembershipParams
  ): Promise<ActionResult> {
    const canManage = await canManageChapter(supabase, {
      managerId: params.managerId,
      chapterId: params.chapterId,
    })

    if (!canManage) {
      return { success: false, error: 'Only admins and same-chapter editors can reject memberships.' }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('chapter_membership')
      .select('id, status')
      .match({ user_id: params.userId, chapter_id: params.chapterId })
      .maybeSingle()

    if (membershipError || !membership) {
      return { success: false, error: 'Membership application not found.' }
    }

    if (membership.status !== 'pending') {
      return { success: false, error: 'Only pending memberships can be rejected.' }
    }

    const { error } = await supabase
      .from('chapter_membership')
      .update({
        approved_by_id: null,
        status: 'rejected',
        member_id: null,
        updated_at: new Date().toISOString(),
      })
      .match({ user_id: params.userId, chapter_id: params.chapterId })

    if (error) return { success: false, error: friendlyMembershipError(error) }
    return { success: true }
  },

  async markAlumni(
    supabase: SupabaseClient<Database>,
    params: MembershipTarget
  ): Promise<ActionResult> {
    const { error } = await supabase
      .from('chapter_membership')
      .update({
        status: 'alumni',
        updated_at: new Date().toISOString(),
      })
      .match({ user_id: params.userId, chapter_id: params.chapterId })

    if (error) return { success: false, error: friendlyMembershipError(error) }
    return { success: true }
  },

  async hasApprovedMembership(
    supabase: SupabaseClient<Database>,
    params: EditorEligibilityParams
  ): Promise<boolean> {
    const match: Record<string, string> = {
      user_id: params.userId,
      status: 'approved',
    }

    if (params.chapterId) {
      match.chapter_id = params.chapterId
    }

    const { data, error } = await supabase
      .from('chapter_membership')
      .select('user_id')
      .match(match)
      .maybeSingle()

    return !error && Boolean(data)
  },

  async ensureCanBecomeEditor(
    supabase: SupabaseClient<Database>,
    params: EditorEligibilityParams
  ): Promise<ActionResult> {
    const canBecomeEditor = await this.hasApprovedMembership(supabase, params)

    if (!canBecomeEditor) {
      return {
        success: false,
        error: 'User must have an approved chapter membership before becoming an editor.',
      }
    }

    return { success: true }
  },
}
