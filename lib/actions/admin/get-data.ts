import { createClient } from '@/lib/supabase/server'
import type {
  CompanyRaw,
  Company,
  RecruiterInvite,
  RecruiterInviteRaw,
  UserWithDetailsRaw,
  UserWithDetails,
  ChapterRow,
  ActivityItem,
  MemberWithProfile,
  RecruiterAccessRow,
  StudentProfileRow,
  UserRow,
} from '@/lib/types'
import type { Role } from '@/lib/types'

export type AdminDashboardStats = {
  total_students: number
  active_chapters: number
  events_this_month: number
  recruiter_opt_in_rate: number
}

export type ChapterActivityItem = {
  id: string
  name: string
  university: string
  member_count: number
  pending_approvals: number
  last_event_at: string | null
}

export type RecentJoinItem = {
  id: string
  name: string | null
  email: string
  role: string
  created_at: string
  chapter_name: string | null
}

export type PendingRecruiterRequestItem = {
  id: string
  recruiter_email: string
  company_name: string | null
  granted_at: string
  invite_expires_at: string | null
}

type ChapterIdRow = {
  chapter_id: string | null
}

type AdminChapterSummary = Pick<ChapterRow, 'id' | 'name' | 'university'>

type RecentJoinUserRow = Pick<UserRow, 'id' | 'name' | 'email' | 'role' | 'created_at'>
type RecentJoinProfileRow = Pick<StudentProfileRow, 'user_id' | 'chapter_id'> & {
  chapter: Pick<ChapterRow, 'name'> | Pick<ChapterRow, 'name'>[] | null
}

type PendingRecruiterAccessRow = Pick<
  RecruiterAccessRow,
  'id' | 'recruiter_email' | 'granted_at' | 'invite_expires_at'
> & {
  company: { name: string } | { name: string }[] | null
}

type AdminChapterCountRow = ChapterRow

type AdminProfileSummaryRow = Pick<
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
> & {
  user:
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>[]
    | null
  chapter:
    | Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'created_at' | 'updated_at' | 'instagram_url' | 'latitude' | 'longitude' | 'location_point'>
    | Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'created_at' | 'updated_at' | 'instagram_url' | 'latitude' | 'longitude' | 'location_point'>[]
    | null
}

type UserProfileSummaryRow = Pick<
  StudentProfileRow,
  'user_id' | 'is_filled' | 'approved_by_id' | 'is_recruiter_visible' | 'approval_status' | 'chapter_id'
> & {
  chapter: Pick<ChapterRow, 'name' | 'university'> | Pick<ChapterRow, 'name' | 'university'>[] | null
}

type ActivityApprovalRow = {
  user_id: string
  updated_at: string
  student: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  chapter: { name: string } | { name: string }[] | null
  approved_by: { name: string | null; email: string } | { name: string | null; email: string }[] | null
}

type ActivityInviteRow = {
  id: string
  granted_at: string
  accepted_at: string | null
  revoked_at: string | null
  recruiter_email: string
  company: { name: string } | { name: string }[] | null
  granted_by: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  accepted_by: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  revoked_by: { name: string | null; email: string } | { name: string | null; email: string }[] | null
}

type AdminUserByIdRow = UserRow & {
  student_profile: (StudentProfileRow & {
    chapter:
      | ChapterRow
      | ChapterRow[]
      | null
  }) | null
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const [studentsResult, chapterMembersResult, monthlyEventsResult, approvedProfilesResult, visibleApprovedProfilesResult] = await Promise.all([
    supabase.from('user').select('id', { count: 'exact', head: true }).eq('role', 'member'),
    supabase.from('student_profile').select('chapter_id'),
    supabase.from('event').select('id', { count: 'exact', head: true }).gte('start_at', monthStart).lt('start_at', monthEnd),
    supabase
      .from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('approval_status', 'approved'),
    supabase
      .from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('approval_status', 'approved')
      .eq('is_recruiter_visible', true),
  ])

  const chapter_idRows = (chapterMembersResult.data ?? []) as ChapterIdRow[]
  const chapter_ids = new Set(
    chapter_idRows.map((row: ChapterIdRow) => row.chapter_id).filter((value): value is string => Boolean(value))
  )
  const approvedCount = approvedProfilesResult.count ?? 0
  const visibleApprovedCount = visibleApprovedProfilesResult.count ?? 0

  return {
    total_students: studentsResult.count ?? 0,
    active_chapters: chapter_ids.size,
    events_this_month: monthlyEventsResult.count ?? 0,
    recruiter_opt_in_rate: approvedCount > 0 ? Math.round((visibleApprovedCount / approvedCount) * 100) : 0,
  }
}

export async function getChapterActivityList(): Promise<ChapterActivityItem[]> {
  const supabase = await createClient()
  const { data: chapters, error } = await supabase
    .from('chapter')
    .select('id, name, university')
    .order('name', { ascending: true })

  if (error || !chapters) {
    console.error('[getChapterActivityList] Failed:', error)
    return []
  }

  const items = await Promise.all(
    (chapters as AdminChapterSummary[]).map(async (chapter: AdminChapterSummary) => {
      const [memberCountResult, pendingApprovalsResult, lastEventResult] = await Promise.all([
        supabase.from('student_profile').select('user_id', { count: 'exact', head: true }).eq('chapter_id', chapter.id),
        supabase
          .from('student_profile')
          .select('user_id', { count: 'exact', head: true })
          .eq('chapter_id', chapter.id)
          .eq('approval_status', 'pending')
          .eq('is_filled', true),
        supabase
          .from('event')
          .select('start_at')
          .eq('chapter_id', chapter.id)
          .order('start_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      return {
        id: chapter.id,
        name: chapter.name,
        university: chapter.university,
        member_count: memberCountResult.count ?? 0,
        pending_approvals: pendingApprovalsResult.count ?? 0,
        last_event_at: lastEventResult.data?.start_at ?? null,
      }
    })
  )

  return items
}

export async function getRecentJoins(limit = 10): Promise<RecentJoinItem[]> {
  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('user')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !users) {
    console.error('[getRecentJoins] Failed:', error)
    return []
  }

  const { data: profiles } = await supabase
    .from('student_profile')
    .select('user_id, chapter_id, chapter(name)')
    .in('user_id', users.map((user) => user.id))

  const userRows = users as RecentJoinUserRow[]
  const profileRows = (profiles ?? []) as RecentJoinProfileRow[]

  return userRows.map((user: RecentJoinUserRow) => {
    const profile = profileRows.find((item: RecentJoinProfileRow) => item.user_id === user.id)
    const chapter = profile?.chapter
    const chapter_name = Array.isArray(chapter) ? (chapter[0]?.name ?? null) : (chapter?.name ?? null)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      chapter_name,
    }
  })
}

export async function getPendingRecruiterRequests(): Promise<PendingRecruiterRequestItem[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('recruiter_access')
    .select(`
      id,
      recruiter_email,
      granted_at,
      invite_expires_at,
      company(name)
    `)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .or(`invite_expires_at.is.null,invite_expires_at.gt.${now}`)
    .order('granted_at', { ascending: false })
    .limit(10)

  if (error || !data) {
    console.error('[getPendingRecruiterRequests] Failed:', error)
    return []
  }

  return (data as PendingRecruiterAccessRow[]).map((item: PendingRecruiterAccessRow) => {
    const company = Array.isArray(item.company) ? item.company[0] : item.company
    return {
      id: item.id,
      recruiter_email: item.recruiter_email,
      company_name: company?.name ?? null,
      granted_at: item.granted_at,
      invite_expires_at: item.invite_expires_at ?? null,
    }
  })
}

export async function getSystemStats() {
  const supabase = await createClient()

  const [
    usersResult,
    chaptersResult,
    companiesResult,
    totalProfilesResult,
    completeProfilesResult,
    pendingApprovalsResult,
    visibleProfilesResult,
    activeRecruitersResult,
    pendingInvitesResult,
  ] = await Promise.all([
    supabase.from('user').select('id', { count: 'exact', head: true }),
    supabase.from('chapter').select('id', { count: 'exact', head: true }),
    supabase.from('company').select('id', { count: 'exact', head: true }),
    supabase.from('student_profile').select('user_id', { count: 'exact', head: true }),
    supabase.from('student_profile').select('user_id', { count: 'exact', head: true }).eq('is_filled', true),
    supabase
      .from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('is_filled', true)
      .eq('approval_status', 'pending'),
    supabase.from('student_profile').select('user_id', { count: 'exact', head: true }).eq('is_recruiter_visible', true),
    supabase
      .from('recruiter_access')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('revoked_at', null),
    supabase
      .from('recruiter_access')
      .select('id', { count: 'exact', head: true })
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('invite_expires_at', new Date().toISOString()),
  ])

  const results = [
    usersResult, chaptersResult, companiesResult,
    totalProfilesResult, completeProfilesResult, pendingApprovalsResult,
    visibleProfilesResult, activeRecruitersResult, pendingInvitesResult,
  ]
  results.forEach((r, i) => {
    if (r.error) console.error(`[getSystemStats] Query ${i} failed:`, r.error)
  })

  const totalProfiles = totalProfilesResult.count ?? 0
  const complete_profiles = completeProfilesResult.count ?? 0
  const completion_rate = totalProfiles > 0
    ? Math.round((complete_profiles / totalProfiles) * 100)
    : 0

  return {
    total_users: usersResult.count ?? 0,
    total_chapters: chaptersResult.count ?? 0,
    total_companies: companiesResult.count ?? 0,
    totalProfiles,
    complete_profiles,
    pending_approvals: pendingApprovalsResult.count ?? 0,
    visibleProfiles: visibleProfilesResult.count ?? 0,
    active_recruiters: activeRecruitersResult.count ?? 0,
    pending_invites: pendingInvitesResult.count ?? 0,
    completion_rate,
  }
}

type RecentApprovalRaw = {
  user_id: string
  updated_at: string
  user: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  approved_by: { name: string | null } | { name: string | null }[] | null
}

type RecentInviteRaw = {
  id: string
  accepted_at: string | null
  recruiter_email: string
  company: { name: string } | { name: string }[] | null
  accepted_by: { name: string | null } | { name: string | null }[] | null
}

export async function getRecentActivity() {
  const supabase = await createClient()

  const { data: recentApprovals } = await supabase
    .from('student_profile')
    .select(`
      user_id,
      updated_at,
      user!inner (
        name,
        email
      ),
      approved_by:user!student_profile_approved_by_id_fkey (
        name
      )
    `)
    .not('approved_by_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(5)

  const { data: recentInvites } = await supabase
    .from('recruiter_access')
    .select(`
      id,
      accepted_at,
      recruiter_email,
      Company (name),
      accepted_by:user!recruiter_access_accepted_by_user_id_fkey (
        name
      )
    `)
    .not('accepted_at', 'is', null)
    .order('accepted_at', { ascending: false })
    .limit(5)

  return {
    recentApprovals: (recentApprovals ?? []) as RecentApprovalRaw[],
    recentInvites: (recentInvites ?? []) as RecentInviteRaw[],
  }
}

type ChapterWithCount = ChapterRow & {
  _count: { users: number }
}

const CHAPTER_SELECT = 'id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point'

export async function getChapters(): Promise<ChapterWithCount[]> {
  const supabase = await createClient()

  const { data: chapters, error } = await supabase
    .from('chapter')
    .select(CHAPTER_SELECT)
    .order('name', { ascending: true })

  if (error || !chapters) {
    console.error('Failed to fetch chapters:', error)
    return []
  }

  const chaptersWithCounts = await Promise.all(
    (chapters as AdminChapterCountRow[]).map(async (chapter: AdminChapterCountRow) => {
      const { count } = await supabase
        .from('student_profile')
        .select('user_id', { count: 'exact', head: true })
        .eq('chapter_id', chapter.id)

      return {
        ...chapter,
        _count: { users: count ?? 0 },
      }
    })
  )

  return chaptersWithCounts
}

const ADMIN_PROFILE_SELECT = `
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
  user:user!inner (
    id,
    email,
    name,
    phone,
    role,
    created_at,
    updated_at
  ),
  chapter:chapter!student_profile_chapter_id_fkey (
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
  )
`

function mapAdminProfile(profile: AdminProfileSummaryRow): MemberWithProfile | null {
  const user = Array.isArray(profile.user) ? profile.user[0] : profile.user
  const chapter = Array.isArray(profile.chapter) ? profile.chapter[0] : profile.chapter

  if (!user) return null
  const skillsValue = profile.skills
  const skills = Array.isArray(skillsValue)
    ? skillsValue.filter((skill): skill is string => typeof skill === 'string')
    : null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role as MemberWithProfile['role'],
    created_at: user.created_at,
    updated_at: user.updated_at,
    deactivated_at: user.deactivated_at ?? null,
    student_profile: {
      user_id: profile.user_id,
      major: profile.major,
      graduation_year: profile.graduation_year,
      linkedin_url: profile.linkedin_url,
      skills,
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
      member_id: null,
    },
    chapter: chapter ?? null,
  }
}

export async function getChapterMembers(chapter_id: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('student_profile')
    .select(ADMIN_PROFILE_SELECT)
    .eq('chapter_id', chapter_id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('[admin/getChapterMembers] Error:', error)
    return []
  }

  return (data as AdminProfileSummaryRow[])
    .map(mapAdminProfile)
    .filter((m): m is MemberWithProfile => m !== null)
}

export async function getChapterMemberCount(chapter_id: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('student_profile')
    .select('user_id', { count: 'exact', head: true })
    .eq('chapter_id', chapter_id)

  return count ?? 0
}

export function normalizeUserWithDetails(
  users: UserWithDetailsRaw[]
): UserWithDetails[] {
  return users.map((user): UserWithDetails => {
    const studentProfile = user.student_profile
    const chapterRaw = studentProfile?.chapter ?? null
    const chapter = Array.isArray(chapterRaw) ? (chapterRaw[0] ?? null) : chapterRaw

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deactivated_at: user.deactivated_at,
      chapter: chapter,
      student_profile: studentProfile
        ? {
            is_filled: studentProfile.is_filled,
            approved_by_id: studentProfile.approved_by_id,
            is_recruiter_visible: studentProfile.is_recruiter_visible,
            approval_status: studentProfile.approval_status,
          }
        : null,
    }
  })
}

export async function getUsers(): Promise<UserWithDetails[]> {
  const supabase = await createClient()

  const { data: users, error: usersError } = await supabase
    .from('user')
    .select('id, email, name, role, phone, created_at, updated_at, deactivated_at')
    .order('created_at', { ascending: false })

  if (usersError || !users) {
    console.error('Failed to fetch users:', usersError)
    return []
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('student_profile')
    .select(`
      user_id,
      is_filled,
      approved_by_id,
      is_recruiter_visible,
      approval_status,
      chapter_id,
      Chapter (name, university)
    `)

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError)
    return []
  }

  const profileRows = (profiles ?? []) as UserProfileSummaryRow[]
  const rawUsers = users.map((user) => {
    const profile = profileRows.find((p: UserProfileSummaryRow) => p.user_id === user.id) ?? null

    const chapter = profile?.chapter
      ? Array.isArray(profile.chapter)
        ? profile.chapter[0]
        : profile.chapter
      : null

    return {
      ...user,
      student_profile: profile
        ? {
            is_filled: profile.is_filled,
            approved_by_id: profile.approved_by_id,
            is_recruiter_visible: profile.is_recruiter_visible,
            approval_status: profile.approval_status,
            chapter_id: profile.chapter_id,
            chapter: chapter,
          }
        : null,
    }
  })

  return normalizeUserWithDetails(rawUsers as unknown as UserWithDetailsRaw[])
}

export async function getActivityLog(): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const { data: approvals, error: approvalsError } = await supabase
    .from('student_profile')
    .select(`
      user_id,
      updated_at,
      chapter_id,
      student:user!inner (
        name,
        email
      ),
      Chapter (name),
      approved_by:user!student_profile_approved_by_id_fkey (
        name,
        email
      )
    `)
    .not('approved_by_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (approvalsError) {
    console.error('[getActivityLog] Approvals error:', approvalsError)
  }

  const { data: invites, error: invitesError } = await supabase
    .from('recruiter_access')
    .select(`
      id,
      granted_at,
      accepted_at,
      revoked_at,
      recruiter_email,
      Company (name),
      granted_by:user!recruiter_access_granted_by_id_fkey (
        name,
        email
      ),
      accepted_by:user!recruiter_access_accepted_by_user_id_fkey (
        name,
        email
      ),
      revoked_by:user!recruiter_access_revoked_by_id_fkey (
        name,
        email
      )
    `)
    .order('granted_at', { ascending: false })
    .limit(20)

  if (invitesError) {
    console.error('[getActivityLog] Invites error:', invitesError)
  }

  const activities: ActivityItem[] = []

  if (approvals) {
    ;(approvals as ActivityApprovalRow[]).forEach((approval: ActivityApprovalRow) => {
      const student = Array.isArray(approval.student) ? approval.student[0] : approval.student
      const approver = Array.isArray(approval.approved_by) ? approval.approved_by[0] : approval.approved_by
      const chapter = Array.isArray(approval.chapter) ? approval.chapter[0] : approval.chapter

      activities.push({
        id: `approval-${approval.user_id}`,
        type: 'approval',
        timestamp: approval.updated_at,
        actor: approver ?? null,
        target: student ?? null,
        chapter: chapter ?? null,
      })
    })
  }

  if (invites) {
    ;(invites as ActivityInviteRow[]).forEach((invite: ActivityInviteRow) => {
      const company = Array.isArray(invite.company) ? invite.company[0] : invite.company
      const grantedBy = Array.isArray(invite.granted_by) ? invite.granted_by[0] : invite.granted_by
      const acceptedBy = Array.isArray(invite.accepted_by) ? invite.accepted_by[0] : invite.accepted_by
      const revokedBy = Array.isArray(invite.revoked_by) ? invite.revoked_by[0] : invite.revoked_by

      activities.push({
        id: `invite-sent-${invite.id}`,
        type: 'invite_sent',
        timestamp: invite.granted_at,
        actor: grantedBy ?? null,
        target: { name: null, email: invite.recruiter_email },
        company: company ?? null,
      })

      if (invite.accepted_at) {
        activities.push({
          id: `invite-accepted-${invite.id}`,
          type: 'invite_accepted',
          timestamp: invite.accepted_at,
          actor: acceptedBy ?? null,
          target: { name: null, email: invite.recruiter_email },
          company: company ?? null,
        })
      }

      if (invite.revoked_at) {
        activities.push({
          id: `invite-revoked-${invite.id}`,
          type: 'invite_revoked',
          timestamp: invite.revoked_at,
          actor: revokedBy ?? null,
          target: { name: null, email: invite.recruiter_email },
          company: company ?? null,
        })
      }
    })
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return activities.slice(0, 50)
}

function normalizeRecruiterInvites(invites: RecruiterInviteRaw[]): RecruiterInvite[] {
  return invites.map((invite: RecruiterInviteRaw) => ({
    ...invite,
    company: Array.isArray(invite.company) ? (invite.company[0] ?? null) : null,
    granted_by: Array.isArray(invite.granted_by) ? (invite.granted_by[0] ?? null) : null,
    accepted_by: Array.isArray(invite.accepted_by) ? (invite.accepted_by[0] ?? null) : null,
  }))
}

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()

  const { data: companies, error } = await supabase
    .from('company')
    .select(`
      id,
      name,
      created_at,
      created_by_id,
      created_by:user!company_created_by_id_fkey (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error || !companies) {
    console.error('Failed to fetch companies:', error)
    return []
  }

  const companiesWithCounts = await Promise.all(
    (companies as CompanyRaw[]).map(async (company: CompanyRaw) => {
      const { count: activeCount } = await supabase
        .from('recruiter_access')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('is_active', true)

      const { count: pendingCount } = await supabase
        .from('recruiter_access')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('invite_expires_at', new Date().toISOString())

      return {
        ...company,
        created_by: company.created_by[0] ?? null,
        _count: {
          active_recruiters: activeCount ?? 0,
          pending_invites: pendingCount ?? 0,
        },
      }
    })
  )

  return companiesWithCounts as Company[]
}

export async function getInvites(): Promise<RecruiterInvite[]> {
  const supabase = await createClient()

  const { data: invites, error } = await supabase
    .from('recruiter_access')
    .select(`
      id,
      recruiter_email,
      is_active,
      granted_at,
      invite_expires_at,
      accepted_at,
      revoked_at,
      company_id,
      Company (name),
      granted_by:user!recruiter_access_granted_by_id_fkey (
        name,
        email
      ),
      accepted_by:user!recruiter_access_accepted_by_user_id_fkey (
        name,
        email
      )
    `)
    .order('granted_at', { ascending: false })

  if (error || !invites) {
    console.error('Failed to fetch invites:', error)
    return []
  }

  return normalizeRecruiterInvites(invites as unknown as RecruiterInviteRaw[])
}

import type { UserWithFullProfile } from '@/lib/types'

export async function getUserById(id: string): Promise<UserWithFullProfile | null> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('user')
    .select(`
      id,
      email,
      name,
      phone,
      role,
      created_at,
      updated_at,
      deactivated_at,
      student_profile!inner (
        user_id,
        major,
        graduation_year,
        linkedin_url,
        skills,
        consent_recruiter_visibility,
        consent_date,
        created_at,
        updated_at,
        approval_status,
        is_recruiter_visible,
        approved_by_id,
        is_filled,
        chapter_id,
        email_notifications_enabled,
        gender,
        member_id,
        chapter!student_profile_chapter_id_fkey (id, name, university, city, region, created_at, updated_at)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !user) {
    console.error('getUserById error:', error)
    return null
  }

  const userRow = user as any
  const studentProfile = Array.isArray(userRow.student_profile) ? userRow.student_profile[0] : userRow.student_profile

  const result = {
    ...userRow,
    student_profile: studentProfile
      ? {
          ...studentProfile,
          chapter: Array.isArray(studentProfile.chapter)
            ? (studentProfile.chapter[0] ?? null)
            : (studentProfile.chapter ?? null),
        }
      : null,
  }

  return result as UserWithFullProfile
}

export async function getChapterById(id: string): Promise<ChapterRow | null> {
  const supabase = await createClient()

  const { data: chapter, error } = await supabase
    .from('chapter')
    .select(CHAPTER_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch chapter:', error)
    return null
  }

  return chapter
}
