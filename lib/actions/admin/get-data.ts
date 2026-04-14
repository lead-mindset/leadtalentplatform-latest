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
  createdAt: string
  chapterName: string | null
}

export type PendingRecruiterRequestItem = {
  id: string
  recruiterEmail: string
  companyName: string | null
  grantedAt: string
  inviteExpiresAt: string | null
}

type ChapterIdRow = {
  chapterId: string | null
}

type AdminChapterSummary = Pick<ChapterRow, 'id' | 'name' | 'university'>

type RecentJoinUserRow = Pick<UserRow, 'id' | 'name' | 'email' | 'role' | 'createdAt'>
type RecentJoinProfileRow = Pick<StudentProfileRow, 'userId' | 'chapterId'> & {
  Chapter: Pick<ChapterRow, 'name'> | Pick<ChapterRow, 'name'>[] | null
}

type PendingRecruiterAccessRow = Pick<
  RecruiterAccessRow,
  'id' | 'recruiterEmail' | 'grantedAt' | 'inviteExpiresAt'
> & {
  Company: { name: string } | { name: string }[] | null
}

type AdminChapterCountRow = ChapterRow

type AdminProfileSummaryRow = Pick<
  StudentProfileRow,
  | 'userId'
  | 'major'
  | 'graduationYear'
  | 'linkedinUrl'
  | 'skills'
  | 'consentRecruiterVisibility'
  | 'isRecruiterVisible'
  | 'approvedById'
  | 'approvalStatus'
  | 'isFilled'
  | 'updatedAt'
  | 'createdAt'
  | 'consentDate'
  | 'chapterId'
  | 'emailNotificationsEnabled'
  | 'gender'
> & {
  User:
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'createdAt' | 'updatedAt' | 'deactivatedAt'>
    | Pick<UserRow, 'id' | 'email' | 'name' | 'phone' | 'role' | 'createdAt' | 'updatedAt' | 'deactivatedAt'>[]
    | null
  Chapter:
    | Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'createdAt' | 'updatedAt'>
    | Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'createdAt' | 'updatedAt'>[]
    | null
}

type UserProfileSummaryRow = Pick<
  StudentProfileRow,
  'userId' | 'isFilled' | 'approvedById' | 'isRecruiterVisible' | 'approvalStatus' | 'chapterId'
> & {
  Chapter: Pick<ChapterRow, 'name' | 'university'> | Pick<ChapterRow, 'name' | 'university'>[] | null
}

type ActivityApprovalRow = {
  userId: string
  updatedAt: string
  Student: { name: string | null; email: string } | { name: string | null; email: string }[] | null
  Chapter: { name: string } | { name: string }[] | null
  ApprovedBy: { name: string | null; email: string } | { name: string | null; email: string }[] | null
}

type ActivityInviteRow = {
  id: string
  grantedAt: string
  acceptedAt: string | null
  revokedAt: string | null
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
    supabase.from('User').select('id', { count: 'exact', head: true }).eq('role', 'member'),
    supabase.from('StudentProfile').select('chapterId'),
    supabase.from('Event').select('id', { count: 'exact', head: true }).gte('startAt', monthStart).lt('startAt', monthEnd),
    supabase
      .from('StudentProfile')
      .select('userId', { count: 'exact', head: true })
      .eq('approvalStatus', 'approved'),
    supabase
      .from('StudentProfile')
      .select('userId', { count: 'exact', head: true })
      .eq('approvalStatus', 'approved')
      .eq('isRecruiterVisible', true),
  ])

  const chapterIdRows = (chapterMembersResult.data ?? []) as ChapterIdRow[]
  const chapterIds = new Set(
    chapterIdRows.map((row: ChapterIdRow) => row.chapterId).filter((value): value is string => Boolean(value))
  )
  const approvedCount = approvedProfilesResult.count ?? 0
  const visibleApprovedCount = visibleApprovedProfilesResult.count ?? 0

  return {
    totalStudents: studentsResult.count ?? 0,
    activeChapters: chapterIds.size,
    eventsThisMonth: monthlyEventsResult.count ?? 0,
    recruiterOptInRate: approvedCount > 0 ? Math.round((visibleApprovedCount / approvedCount) * 100) : 0,
  }
}

export async function getChapterActivityList(): Promise<ChapterActivityItem[]> {
  const supabase = await createClient()
  const { data: chapters, error } = await supabase
    .from('Chapter')
    .select('id, name, university')
    .order('name', { ascending: true })

  if (error || !chapters) {
    console.error('[getChapterActivityList] Failed:', error)
    return []
  }

  const items = await Promise.all(
    (chapters as AdminChapterSummary[]).map(async (chapter: AdminChapterSummary) => {
      const [memberCountResult, pendingApprovalsResult, lastEventResult] = await Promise.all([
        supabase.from('StudentProfile').select('userId', { count: 'exact', head: true }).eq('chapterId', chapter.id),
        supabase
          .from('StudentProfile')
          .select('userId', { count: 'exact', head: true })
          .eq('chapterId', chapter.id)
          .eq('approvalStatus', 'pending')
          .eq('isFilled', true),
        supabase
          .from('Event')
          .select('startAt')
          .eq('chapterId', chapter.id)
          .order('startAt', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      return {
        id: chapter.id,
        name: chapter.name,
        university: chapter.university,
        memberCount: memberCountResult.count ?? 0,
        pendingApprovals: pendingApprovalsResult.count ?? 0,
        lastEventAt: lastEventResult.data?.startAt ?? null,
      }
    })
  )

  return items
}

export async function getRecentJoins(limit = 10): Promise<RecentJoinItem[]> {
  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('User')
    .select('id, name, email, role, createdAt')
    .order('createdAt', { ascending: false })
    .limit(limit)

  if (error || !users) {
    console.error('[getRecentJoins] Failed:', error)
    return []
  }

  const { data: profiles } = await supabase
    .from('StudentProfile')
    .select('userId, chapterId, Chapter(name)')
    .in('userId', users.map((user) => user.id))

  const userRows = users as RecentJoinUserRow[]
  const profileRows = (profiles ?? []) as RecentJoinProfileRow[]

  return userRows.map((user: RecentJoinUserRow) => {
    const profile = profileRows.find((item: RecentJoinProfileRow) => item.userId === user.id)
    const chapter = profile?.Chapter
    const chapterName = Array.isArray(chapter) ? (chapter[0]?.name ?? null) : (chapter?.name ?? null)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      chapterName,
    }
  })
}

export async function getPendingRecruiterRequests(): Promise<PendingRecruiterRequestItem[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('RecruiterAccess')
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
    supabase.from('User').select('id', { count: 'exact', head: true }),
    supabase.from('Chapter').select('id', { count: 'exact', head: true }),
    supabase.from('Company').select('id', { count: 'exact', head: true }),
    supabase.from('StudentProfile').select('userId', { count: 'exact', head: true }),
    supabase.from('StudentProfile').select('userId', { count: 'exact', head: true }).eq('isFilled', true),
    supabase
      .from('StudentProfile')
      .select('userId', { count: 'exact', head: true })
      .eq('isFilled', true)
      .eq('approvalStatus', 'pending'),
    supabase.from('StudentProfile').select('userId', { count: 'exact', head: true }).eq('isRecruiterVisible', true),
    supabase
      .from('RecruiterAccess')
      .select('id', { count: 'exact', head: true })
      .eq('isActive', true)
      .is('revokedAt', null),
    supabase
      .from('RecruiterAccess')
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
  userId: string
  updatedAt: string
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
    .from('StudentProfile')
    .select(`
      userId,
      updatedAt,
      User!StudentProfile_userId_fkey (
        name,
        email
      ),
      ApprovedBy:User!StudentProfile_approvedById_fkey (
        name
      )
    `)
    .not('approvedById', 'is', null)
    .order('updatedAt', { ascending: false })
    .limit(5)

  const { data: recentInvites } = await supabase
    .from('RecruiterAccess')
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

const CHAPTER_SELECT = 'id, name, university, city, region, createdAt, updatedAt'

export async function getChapters(): Promise<ChapterWithCount[]> {
  const supabase = await createClient()

  const { data: chapters, error } = await supabase
    .from('Chapter')
    .select(CHAPTER_SELECT)
    .order('name', { ascending: true })

  if (error || !chapters) {
    console.error('Failed to fetch chapters:', error)
    return []
  }

  const chaptersWithCounts = await Promise.all(
    (chapters as AdminChapterCountRow[]).map(async (chapter: AdminChapterCountRow) => {
      const { count } = await supabase
        .from('StudentProfile')
        .select('userId', { count: 'exact', head: true })
        .eq('chapterId', chapter.id)

      return {
        ...chapter,
        _count: { users: count ?? 0 },
      }
    })
  )

  return chaptersWithCounts
}

const ADMIN_PROFILE_SELECT = `
  userId,
  major,
  graduationYear,
  linkedinUrl,
  skills,
  consentRecruiterVisibility,
  isRecruiterVisible,
  approvedById,
  approvalStatus,
  isFilled,
  updatedAt,
  createdAt,
  consentDate,
  chapterId,
  emailNotificationsEnabled,
  gender,
  User:User!StudentProfile_userId_fkey (
    id,
    email,
    name,
    phone,
    role,
    createdAt,
    updatedAt
  ),
  Chapter:Chapter!StudentProfile_chapterId_fkey (
    id,
    name,
    university,
    city,
    region,
    createdAt,
    updatedAt
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deactivatedAt: user.deactivatedAt ?? null,
    StudentProfile: {
      userId: profile.userId,
      major: profile.major,
      graduationYear: profile.graduationYear,
      linkedinUrl: profile.linkedinUrl,
      skills,
      consentRecruiterVisibility: profile.consentRecruiterVisibility,
      isRecruiterVisible: profile.isRecruiterVisible,
      approvedById: profile.approvedById,
      approvalStatus: profile.approvalStatus,
      isFilled: profile.isFilled,
      updatedAt: profile.updatedAt,
      createdAt: profile.createdAt,
      consentDate: profile.consentDate,
      chapterId: profile.chapterId,
      emailNotificationsEnabled: profile.emailNotificationsEnabled,
      gender: profile.gender,
      memberId: null,
    },
    Chapter: chapter ?? null,
  }
}

export async function getChapterMembers(chapterId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('StudentProfile')
    .select(ADMIN_PROFILE_SELECT)
    .eq('chapterId', chapterId)
    .order('createdAt', { ascending: false })

  if (error || !data) {
    console.error('[admin/getChapterMembers] Error:', error)
    return []
  }

  return (data as AdminProfileSummaryRow[])
    .map(mapAdminProfile)
    .filter((m): m is MemberWithProfile => m !== null)
}

export async function getChapterMemberCount(chapterId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('StudentProfile')
    .select('userId', { count: 'exact', head: true })
    .eq('chapterId', chapterId)

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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deactivatedAt: user.deactivatedAt,
      Chapter: chapter,
      StudentProfile: studentProfile
        ? {
            isFilled: studentProfile.isFilled,
            approvedById: studentProfile.approvedById,
            isRecruiterVisible: studentProfile.isRecruiterVisible,
            approvalStatus: studentProfile.approvalStatus,
          }
        : null,
    }
  })
}

export async function getUsers(): Promise<UserWithDetails[]> {
  const supabase = await createClient()

  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, email, name, role, phone, createdAt, updatedAt, deactivatedAt')
    .order('createdAt', { ascending: false })

  if (usersError || !users) {
    console.error('Failed to fetch users:', usersError)
    return []
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      isFilled,
      approvedById,
      isRecruiterVisible,
      approvalStatus,
      chapterId,
      Chapter (name, university)
    `)

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError)
    return []
  }

  const profileRows = (profiles ?? []) as UserProfileSummaryRow[]
  const rawUsers: UserWithDetailsRaw[] = users.map((user) => {
    const profile = profileRows.find((p: UserProfileSummaryRow) => p.userId === user.id) ?? null

    const chapter = profile?.Chapter
      ? Array.isArray(profile.Chapter)
        ? profile.Chapter[0]
        : profile.Chapter
      : null

    return {
      ...user,
      StudentProfile: profile
        ? {
            isFilled: profile.isFilled,
            approvedById: profile.approvedById,
            isRecruiterVisible: profile.isRecruiterVisible,
            approvalStatus: profile.approvalStatus,
            chapterId: profile.chapterId,
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
    .from('StudentProfile')
    .select(`
      userId,
      updatedAt,
      chapterId,
      Student:User!StudentProfile_userId_fkey (
        name,
        email
      ),
      Chapter (name),
      ApprovedBy:User!StudentProfile_approvedById_fkey (
        name,
        email
      )
    `)
    .not('approvedById', 'is', null)
    .order('updatedAt', { ascending: false })
    .limit(20)

  if (approvalsError) {
    console.error('[getActivityLog] Approvals error:', approvalsError)
  }

  const { data: invites, error: invitesError } = await supabase
    .from('RecruiterAccess')
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
        id: `approval-${approval.userId}`,
        type: 'approval',
        timestamp: approval.updatedAt,
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
    .from('Company')
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
        .from('RecruiterAccess')
        .select('id', { count: 'exact', head: true })
        .eq('companyId', company.id)
        .eq('isActive', true)

      const { count: pendingCount } = await supabase
        .from('RecruiterAccess')
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
    .from('RecruiterAccess')
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
    .from('User')
    .select(`
      StudentProfile!StudentProfile_userId_fkey (
        userId,
        major,
        graduationYear,
        linkedinUrl,
        skills,
        consentRecruiterVisibility,
        consentDate,
        createdAt,
        updatedAt,
        approvalStatus,
        isRecruiterVisible,
        approvedById,
        isFilled,
        chapterId,
        emailNotificationsEnabled,
        gender,
        memberId,
        Chapter (id, name, university, city, region, createdAt, updatedAt)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !user) {
    console.error('getUserById error:', error)
    return null
  }

  const userRow = user as AdminUserByIdRow

  return {
    ...userRow,
    StudentProfile: userRow.StudentProfile
      ? {
          ...userRow.StudentProfile,
          Chapter: Array.isArray(userRow.StudentProfile.Chapter)
            ? (userRow.StudentProfile.Chapter[0] ?? null)
            : (userRow.StudentProfile.Chapter ?? null),
        }
      : null,
  }
}

export async function getChapterById(id: string): Promise<ChapterRow | null> {
  const supabase = await createClient()

  const { data: chapter, error } = await supabase
    .from('Chapter')
    .select(CHAPTER_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch chapter:', error)
    return null
  }

  return chapter
}
