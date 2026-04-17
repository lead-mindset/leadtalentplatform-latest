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
  totalStudents: number
  activeChapters: number
  eventsThisMonth: number
  recruiterOptInRate: number
}

export type ChapterActivityItem = {
  id: string
  name: string
  university: string
  memberCount: number
  pendingApprovals: number
  lastEventAt: string | null
}

export type RecentJoinItem = {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  chapterName: string | null
}

export type PendingRecruiterRequestItem = {
  id: string
  recruiterEmail: string
  companyName: string | null
  granted_at: string
  invite_expires_at: string | null
}

type ChapterIdRow = {
  chapter_id: string | null
}

type AdminChapterSummary = Pick<ChapterRow, 'id' | 'name' | 'university'>

type RecentJoinUserRow = Pick<UserRow, 'id' | 'name' | 'email' | 'role' | 'created_at'>
type RecentJoinProfileRow = Pick<StudentProfileRow, 'user_id' | 'chapter_id'> & {
  Chapter: Pick<ChapterRow, 'name'> | Pick<ChapterRow, 'name'>[] | null
}

type PendingRecruiterAccessRow = Pick<
  RecruiterAccessRow,
  'id' | 'recruiter_email' | 'granted_at' | 'invite_expires_at'
> & {
  Company: { name: string } | { name: string }[] | null
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
  User:
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'created_at' | 'updated_at' | 'deactivated_at'>[]
    | null
  Chapter:
    | Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'created_at' | 'updated_at'>
    | Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'created_at' | 'updated_at'>[]
    | null
}

type UserProfileSummaryRow = Pick<
  StudentProfileRow,
  'user_id' | 'is_filled' | 'approved_by_id' | 'is_recruiter_visible' | 'approval_status' | 'chapter_id'
> & {
  Chapter: Pick<ChapterRow, 'name' | 'university'> | Pick<ChapterRow, 'name' | 'university'>[] | null
}

type ActivityApprovalRow = {
  user_id: string
  updated_at: string
  Student: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  Chapter: { name: string } | { name: string }[] | null
  ApprovedBy: { name: string | null; email: string } | { name: string | null; email: string }[] | null
}

type ActivityInviteRow = {
  id: string
  granted_at: string
  accepted_at: string | null
  revoked_at: string | null
  recruiterEmail: string
  Company: { name: string } | { name: string }[] | null
  GrantedBy: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  AcceptedBy: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  RevokedBy: { name: string | null; email: string } | { name: string | null; email: string }[] | null
}

type AdminUserByIdRow = UserRow & {
  StudentProfile: (StudentProfileRow & {
    Chapter:
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
    totalStudents: studentsResult.count ?? 0,
    activeChapters: chapter_ids.size,
    eventsThisMonth: monthlyEventsResult.count ?? 0,
    recruiterOptInRate: approvedCount > 0 ? Math.round((visibleApprovedCount / approvedCount) * 100) : 0,
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
        memberCount: memberCountResult.count ?? 0,
        pendingApprovals: pendingApprovalsResult.count ?? 0,
        lastEventAt: lastEventResult.data?.start_at ?? null,
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
    .select('user_id, chapter_id, Chapter(name)')
    .in('user_id', users.map((user) => user.id))

  const userRows = users as RecentJoinUserRow[]
  const profileRows = (profiles ?? []) as RecentJoinProfileRow[]

  return userRows.map((user: RecentJoinUserRow) => {
    const profile = profileRows.find((item: RecentJoinProfileRow) => item.user_id === user.id)
    const chapter = profile?.Chapter
    const chapterName = Array.isArray(chapter) ? (chapter[0]?.name ?? null) : (chapter?.name ?? null)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      chapterName,
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
      recruiterEmail,
      grantedAt,
      inviteExpiresAt,
      Company(name)
    `)
    .is('acceptedAt', null)
    .is('revokedAt', null)
    .or(`inviteExpiresAt.is.null,inviteExpiresAt.gt.${now}`)
    .order('grantedAt', { ascending: false })
    .limit(10)

  if (error || !data) {
    console.error('[getPendingRecruiterRequests] Failed:', error)
    return []
  }

  return (data as PendingRecruiterAccessRow[]).map((item: PendingRecruiterAccessRow) => {
    const company = Array.isArray(item.Company) ? item.Company[0] : item.Company
    return {
      id: item.id,
      recruiterEmail: item.recruiterEmail,
      companyName: company?.name ?? null,
      grantedAt: item.grantedAt,
      inviteExpiresAt: item.inviteExpiresAt ?? null,
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
      .eq('isActive', true)
      .is('revokedAt', null),
    supabase
      .from('recruiter_access')
      .select('id', { count: 'exact', head: true })
      .is('acceptedAt', null)
      .is('revokedAt', null)
      .gt('inviteExpiresAt', new Date().toISOString()),
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
  const completeProfiles = completeProfilesResult.count ?? 0
  const completionRate = totalProfiles > 0
    ? Math.round((completeProfiles / totalProfiles) * 100)
    : 0

  return {
    totalUsers: usersResult.count ?? 0,
    totalChapters: chaptersResult.count ?? 0,
    totalCompanies: companiesResult.count ?? 0,
    totalProfiles,
    completeProfiles,
    pendingApprovals: pendingApprovalsResult.count ?? 0,
    visibleProfiles: visibleProfilesResult.count ?? 0,
    activeRecruiters: activeRecruitersResult.count ?? 0,
    pendingInvites: pendingInvitesResult.count ?? 0,
    completionRate,
  }
}

type RecentApprovalRaw = {
  user_id: string
  updated_at: string
  User: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  ApprovedBy: { name: string | null } | { name: string | null }[] | null
}

type RecentInviteRaw = {
  id: string
  acceptedAt: string | null
  recruiterEmail: string
  Company: { name: string } | { name: string }[] | null
  AcceptedBy: { name: string | null } | { name: string | null }[] | null
}

export async function getRecentActivity() {
  const supabase = await createClient()

  const { data: recentApprovals } = await supabase
    .from('student_profile')
    .select(`
      user_id,
      updated_at,
      User!StudentProfile_user_id_fkey (
        name,
        email
      ),
      ApprovedBy:User!StudentProfile_approved_by_id_fkey (
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
      acceptedAt,
      recruiterEmail,
      Company (name),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name
      )
    `)
    .not('acceptedAt', 'is', null)
    .order('acceptedAt', { ascending: false })
    .limit(5)

  return {
    recentApprovals: (recentApprovals ?? []) as RecentApprovalRaw[],
    recentInvites: (recentInvites ?? []) as RecentInviteRaw[],
  }
}

type ChapterWithCount = ChapterRow & {
  _count: { users: number }
}

const CHAPTER_SELECT = 'id, name, university, city, region, created_at, updated_at'

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
  graduationYear,
  linkedinUrl,
  skills,
  consentRecruiterVisibility,
  is_recruiter_visible,
  approved_by_id,
  approval_status,
  is_filled,
  updated_at,
  created_at,
  consentDate,
  chapter_id,
  emailNotificationsEnabled,
  gender,
  User:User!StudentProfile_user_id_fkey (
    id,
    email,
    name,
    phone,
    role,
    created_at,
    updated_at
  ),
  Chapter:Chapter!StudentProfile_chapter_id_fkey (
    id,
    name,
    university,
    city,
    region,
    created_at,
    updated_at
  )
`

function mapAdminProfile(profile: AdminProfileSummaryRow): MemberWithProfile | null {
  const user = Array.isArray(profile.User) ? profile.User[0] : profile.User
  const chapter = Array.isArray(profile.Chapter) ? profile.Chapter[0] : profile.Chapter

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
    deactivatedAt: user.deactivatedAt ?? null,
    StudentProfile: {
      user_id: profile.user_id,
      major: profile.major,
      graduationYear: profile.graduationYear,
      linkedinUrl: profile.linkedinUrl,
      skills,
      consentRecruiterVisibility: profile.consentRecruiterVisibility,
      is_recruiter_visible: profile.is_recruiter_visible,
      approved_by_id: profile.approved_by_id,
      approval_status: profile.approval_status,
      is_filled: profile.is_filled,
      updated_at: profile.updated_at,
      created_at: profile.created_at,
      consentDate: profile.consentDate,
      chapter_id: profile.chapter_id,
      emailNotificationsEnabled: profile.emailNotificationsEnabled,
      gender: profile.gender,
      memberId: null,
    },
    Chapter: chapter ?? null,
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
    const studentProfile = user.StudentProfile
    const chapter = studentProfile?.Chapter ?? null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deactivatedAt: user.deactivatedAt,
      Chapter: chapter,
      StudentProfile: studentProfile
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
    .select('id, email, name, role, phone, created_at, updated_at, deactivatedAt')
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
  const rawUsers: UserWithDetailsRaw[] = users.map((user) => {
    const profile = profileRows.find((p: UserProfileSummaryRow) => p.user_id === user.id) ?? null

    const chapter = profile?.Chapter
      ? Array.isArray(profile.Chapter)
        ? profile.Chapter[0]
        : profile.Chapter
      : null

    return {
      ...user,
      StudentProfile: profile
        ? {
            is_filled: profile.is_filled,
            approved_by_id: profile.approved_by_id,
            is_recruiter_visible: profile.is_recruiter_visible,
            approval_status: profile.approval_status,
            chapter_id: profile.chapter_id,
            Chapter: chapter,
          }
        : null,
    }
  })

  return normalizeUserWithDetails(rawUsers)
}

export async function getActivityLog(): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const { data: approvals, error: approvalsError } = await supabase
    .from('student_profile')
    .select(`
      user_id,
      updated_at,
      chapter_id,
      Student:User!StudentProfile_user_id_fkey (
        name,
        email
      ),
      Chapter (name),
      ApprovedBy:User!StudentProfile_approved_by_id_fkey (
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
      grantedAt,
      acceptedAt,
      revokedAt,
      recruiterEmail,
      Company (name),
      GrantedBy:User!RecruiterAccess_grantedById_fkey (
        name,
        email
      ),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name,
        email
      ),
      RevokedBy:User!RecruiterAccess_revokedById_fkey (
        name,
        email
      )
    `)
    .order('grantedAt', { ascending: false })
    .limit(20)

  if (invitesError) {
    console.error('[getActivityLog] Invites error:', invitesError)
  }

  const activities: ActivityItem[] = []

  if (approvals) {
    ;(approvals as ActivityApprovalRow[]).forEach((approval: ActivityApprovalRow) => {
      const student = Array.isArray(approval.Student) ? approval.Student[0] : approval.Student
      const approver = Array.isArray(approval.ApprovedBy) ? approval.ApprovedBy[0] : approval.ApprovedBy
      const chapter = Array.isArray(approval.Chapter) ? approval.Chapter[0] : approval.Chapter

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
      const company = Array.isArray(invite.Company) ? invite.Company[0] : invite.Company
      const grantedBy = Array.isArray(invite.GrantedBy) ? invite.GrantedBy[0] : invite.GrantedBy
      const acceptedBy = Array.isArray(invite.AcceptedBy) ? invite.AcceptedBy[0] : invite.AcceptedBy
      const revokedBy = Array.isArray(invite.RevokedBy) ? invite.RevokedBy[0] : invite.RevokedBy

      activities.push({
        id: `invite-sent-${invite.id}`,
        type: 'invite_sent',
        timestamp: invite.grantedAt,
        actor: grantedBy ?? null,
        target: { name: null, email: invite.recruiterEmail },
        company: company ?? null,
      })

      if (invite.acceptedAt) {
        activities.push({
          id: `invite-accepted-${invite.id}`,
          type: 'invite_accepted',
          timestamp: invite.acceptedAt,
          actor: acceptedBy ?? null,
          target: { name: null, email: invite.recruiterEmail },
          company: company ?? null,
        })
      }

      if (invite.revokedAt) {
        activities.push({
          id: `invite-revoked-${invite.id}`,
          type: 'invite_revoked',
          timestamp: invite.revokedAt,
          actor: revokedBy ?? null,
          target: { name: null, email: invite.recruiterEmail },
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
    Company: Array.isArray(invite.Company) ? (invite.Company[0] ?? null) : null,
    GrantedBy: Array.isArray(invite.GrantedBy) ? (invite.GrantedBy[0] ?? null) : null,
    AcceptedBy: Array.isArray(invite.AcceptedBy) ? (invite.AcceptedBy[0] ?? null) : null,
  }))
}

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()

  const { data: companies, error } = await supabase
    .from('company')
    .select(`
      id,
      name,
      createdat,
      createdbyid,
      CreatedBy:User!Company_createdbyid_fkey (
        name,
        email
      )
    `)
    .order('createdat', { ascending: false })

  if (error || !companies) {
    console.error('Failed to fetch companies:', error)
    return []
  }

  const companiesWithCounts = await Promise.all(
    (companies as CompanyRaw[]).map(async (company: CompanyRaw) => {
      const { count: activeCount } = await supabase
        .from('recruiter_access')
        .select('id', { count: 'exact', head: true })
        .eq('companyId', company.id)
        .eq('isActive', true)

      const { count: pendingCount } = await supabase
        .from('recruiter_access')
        .select('id', { count: 'exact', head: true })
        .eq('companyId', company.id)
        .is('acceptedAt', null)
        .is('revokedAt', null)
        .gt('inviteExpiresAt', new Date().toISOString())

      return {
        ...company,
        CreatedBy: company.CreatedBy[0] ?? null,
        _count: {
          activeRecruiters: activeCount ?? 0,
          pendingInvites: pendingCount ?? 0,
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
      recruiterEmail,
      isActive,
      grantedAt,
      inviteExpiresAt,
      acceptedAt,
      revokedAt,
      companyId,
      Company (name),
      GrantedBy:User!RecruiterAccess_grantedById_fkey (
        name,
        email
      ),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name,
        email
      )
    `)
    .order('grantedAt', { ascending: false })

  if (error || !invites) {
    console.error('Failed to fetch invites:', error)
    return []
  }

  return normalizeRecruiterInvites(invites as RecruiterInviteRaw[])
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
      deactivatedAt,
      StudentProfile!StudentProfile_user_id_fkey (
        user_id,
        major,
        graduationYear,
        linkedinUrl,
        skills,
        consentRecruiterVisibility,
        consentDate,
        created_at,
        updated_at,
        approval_status,
        is_recruiter_visible,
        approved_by_id,
        is_filled,
        chapter_id,
        emailNotificationsEnabled,
        gender,
        memberId,
        Chapter!StudentProfile_chapter_id_fkey (id, name, university, city, region, created_at, updated_at)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !user) {
    console.error('getUserById error:', error)
    return null
  }

  const userRow = user as any
  const studentProfile = Array.isArray(userRow.StudentProfile) ? userRow.StudentProfile[0] : userRow.StudentProfile

  const result = {
    ...userRow,
    StudentProfile: studentProfile
      ? {
          ...studentProfile,
          Chapter: Array.isArray(studentProfile.Chapter)
            ? (studentProfile.Chapter[0] ?? null)
            : (studentProfile.Chapter ?? null),
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
