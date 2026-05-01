import { logger } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type {
  ActivityItem,
  ChapterRow,
  Company,
  CompanyRaw,
  MemberWithProfile,
  RecruiterAccessRow,
  RecruiterInvite,
  RecruiterInviteRaw,
  Role,
  StudentProfileRow,
  UserRow,
  UserWithDetails,
  UserWithDetailsRaw,
  UserWithFullProfile,
} from '@/lib/types'

// ───────────────────────────────────────────────────────────────
// Internal types (get-data.ts)
// ───────────────────────────────────────────────────────────────

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
    chapter: ChapterRow | ChapterRow[] | null
  }) | null
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

type ChapterWithCount = ChapterRow & {
  _count: { users: number }
}

// ───────────────────────────────────────────────────────────────
// Internal types (users.ts)
// ───────────────────────────────────────────────────────────────

type AdminUsersProfileRow = Pick<StudentProfileRow, 'user_id' | 'chapter_id' | 'is_filled' | 'approval_status'> & {
  chapter: Pick<ChapterRow, 'name'> | Pick<ChapterRow, 'name'>[] | null
}

type AdminUsersProfileSummary = {
  chapter_id: string | null
  chapter_name: string | null
  is_filled: boolean
  approval_status: StudentProfileRow['approval_status']
}

// ───────────────────────────────────────────────────────────────
// Internal types (events.ts)
// ───────────────────────────────────────────────────────────────

// (none beyond the exported ones)

// ───────────────────────────────────────────────────────────────
// Exported types (get-data.ts)
// ───────────────────────────────────────────────────────────────

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

// ───────────────────────────────────────────────────────────────
// Exported types (users.ts)
// ───────────────────────────────────────────────────────────────

export type ProfileStatusFilter = 'complete' | 'pending_approval' | 'incomplete' | 'no_profile'
export type UserSortKey = 'name' | 'email' | 'role' | 'chapter' | 'created_at' | 'profile_status'
export type SortOrder = 'asc' | 'desc'

export type UsersFilters = {
  search?: string
  roles?: Role[]
  chapter_ids?: string[]
  approval_statuses?: ProfileStatusFilter[]
}

export type UsersPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: UserSortKey
  sortOrder?: SortOrder
}

export type AdminUserListItem = {
  id: string
  name: string | null
  email: string
  role: Role
  created_at: string
  deactivated_at: string | null
  chapter_id: string | null
  chapter_name: string | null
  profile_status: ProfileStatusFilter
}

export type UsersListResponse = {
  items: AdminUserListItem[]
  total: number
  page: number
  pageSize: number
}

export type ActionResult = { success: true } | { success: false; error: string }

export type BulkAction =
  | { type: 'change_role'; role: Role }
  | { type: 'deactivate' }
  | { type: 'reactivate' }

// ───────────────────────────────────────────────────────────────
// Exported types (events.ts)
// ───────────────────────────────────────────────────────────────

export type AdminEventStatus = 'published' | 'draft' | 'upcoming' | 'past'
export type EventSortKey = 'title' | 'start_at' | 'chapter' | 'status' | 'registrations'

export type EventFilters = {
  search?: string
  chapter_ids?: string[]
  statuses?: AdminEventStatus[]
}

export type EventPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: EventSortKey
  sortOrder?: SortOrder
}

export type AdminEventListItem = {
  id: string
  title: string
  start_at: string
  end_at: string
  is_published: boolean
  chapter_id: string | null
  chapter_name: string | null
  registrations: number
  capacity: number | null
  chapter?: { id: string; name: string; university: string } | null
  event_chapter?: Array<{
    id: string
    chapter: { id: string; name: string; university: string }
  }>
}

export type AdminEventsListResponse = {
  items: AdminEventListItem[]
  total: number
  page: number
  pageSize: number
}

// ───────────────────────────────────────────────────────────────
// Exported types (chapters.ts)
// ───────────────────────────────────────────────────────────────

export type ChapterSortKey =
  | 'name'
  | 'university'
  | 'city'
  | 'region'
  | 'member_count'
  | 'active_events_count'

export type ChaptersFilters = {
  search?: string
}

export type ChaptersPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: ChapterSortKey
  sortOrder?: SortOrder
}

export type ChapterListItem = {
  id: string
  name: string
  university: string
  city: string | null
  region: string | null
  member_count: number
  active_events_count: number
  editors: { id: string; name: string; email: string }[]
}

export type ChaptersListResponse = {
  items: ChapterListItem[]
  total: number
  page: number
  pageSize: number
}

export type ChapterFormInput = {
  id: string
  name: string
  university: string
  city?: string
  region?: string
  editorIds?: string[]
}

// ───────────────────────────────────────────────────────────────
// Exported types (companies.ts)
// ───────────────────────────────────────────────────────────────

export type CompanySortKey = 'name' | 'created_at' | 'active_recruiters' | 'pending_invites'

export type CompaniesFilters = {
  search?: string
}

export type CompaniesPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: CompanySortKey
  sortOrder?: SortOrder
}

export type CompanyListItem = {
  id: string
  name: string
  created_at: string
  created_by_name: string | null
  active_recruiters: number
  pending_invites: number
}

export type CompanyDetail = {
  id: string
  name: string
  created_at: string
  created_by_name: string | null
  recruiters: {
    id: string
    recruiter_email: string
    is_active: boolean
    invite_token: string
    invite_expires_at: string | null
    accepted_at: string | null
    accepted_by_user_id: string | null
    revoked_at: string | null
    granted_at: string
  }[]
}

export type CompaniesListResponse = {
  items: CompanyListItem[]
  total: number
  page: number
  pageSize: number
}

export type InviteResult = { success: true; inviteLink?: string } | { success: false; error: string }

// ───────────────────────────────────────────────────────────────
// Internal constants
// ───────────────────────────────────────────────────────────────

const CHAPTER_SELECT = 'id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point'

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

// ───────────────────────────────────────────────────────────────
// Internal helper functions (get-data.ts)
// ───────────────────────────────────────────────────────────────

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

// ───────────────────────────────────────────────────────────────
// Internal helper functions (users.ts)
// ───────────────────────────────────────────────────────────────

function toProfileStatus(profile: { is_filled: boolean; approval_status: string | null } | null): ProfileStatusFilter {
  if (!profile) return 'no_profile'
  if (!profile.is_filled) return 'incomplete'
  if (profile.approval_status === 'pending') return 'pending_approval'
  return 'complete'
}

function csvCell(value: string | null | undefined): string {
  const normalized = value ?? ''
  return `"${normalized.replace(/"/g, '""')}"`
}

function sortAdminUserRows(items: AdminUserListItem[], sortBy: UserSortKey, sortOrder: SortOrder): AdminUserListItem[] {
  const direction = sortOrder === 'asc' ? 1 : -1
  const sorted = [...items]
  sorted.sort((a, b) => {
    const byString = (left: string, right: string) => left.localeCompare(right) * direction
    const byDate = (left: string, right: string) =>
      (new Date(left).getTime() - new Date(right).getTime()) * direction

    switch (sortBy) {
      case 'name':
        return byString(a.name ?? '', b.name ?? '')
      case 'email':
        return byString(a.email, b.email)
      case 'role':
        return byString(a.role, b.role)
      case 'chapter':
        return byString(a.chapter_name ?? '', b.chapter_name ?? '')
      case 'profile_status':
        return byString(a.profile_status, b.profile_status)
      case 'created_at':
      default:
        return byDate(a.created_at, b.created_at)
    }
  })
  return sorted
}

// ───────────────────────────────────────────────────────────────
// Internal helper functions (events.ts)
// ───────────────────────────────────────────────────────────────

function getEventStatus(row: AdminEventListItem): AdminEventStatus {
  const now = Date.now()
  const ended = new Date(row.end_at).getTime() < now
  if (ended) return 'past'
  if (!row.is_published) return 'draft'
  if (new Date(row.start_at).getTime() > now) return 'upcoming'
  return 'published'
}

function sortAdminEventRows(rows: AdminEventListItem[], sortBy: EventSortKey, sortOrder: SortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title) * direction
      case 'chapter':
        return (a.chapter_name ?? '').localeCompare(b.chapter_name ?? '') * direction
      case 'status':
        return getEventStatus(a).localeCompare(getEventStatus(b)) * direction
      case 'registrations':
        return (a.registrations - b.registrations) * direction
      case 'start_at':
      default:
        return (new Date(a.start_at).getTime() - new Date(b.start_at).getTime()) * direction
    }
  })
}

// ───────────────────────────────────────────────────────────────
// Internal helper functions (chapters.ts)
// ───────────────────────────────────────────────────────────────

function sortChapterRows(items: ChapterListItem[], sortBy: ChapterSortKey, sortOrder: SortOrder): ChapterListItem[] {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * direction
      case 'university':
        return a.university.localeCompare(b.university) * direction
      case 'city':
        return (a.city ?? '').localeCompare(b.city ?? '') * direction
      case 'region':
        return (a.region ?? '').localeCompare(b.region ?? '') * direction
      case 'member_count':
        return (a.member_count - b.member_count) * direction
      case 'active_events_count':
        return (a.active_events_count - b.active_events_count) * direction
      default:
        return a.name.localeCompare(b.name) * direction
    }
  })
}

// ───────────────────────────────────────────────────────────────
// Internal helper functions (companies.ts)
// ───────────────────────────────────────────────────────────────

function generateInviteLink(token: string): string {
  return `/recruiter/access?token=${token}`
}

function getExpiryDate(days: number | null): string | null {
  if (days === null) return null
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function sortCompanyRows(rows: CompanyListItem[], sortBy: CompanySortKey, sortOrder: SortOrder): CompanyListItem[] {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * direction
      case 'active_recruiters':
        return (a.active_recruiters - b.active_recruiters) * direction
      case 'pending_invites':
        return (a.pending_invites - b.pending_invites) * direction
      case 'created_at':
      default:
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction
    }
  })
}

// ───────────────────────────────────────────────────────────────
// Service
// ───────────────────────────────────────────────────────────────

export const AdminService = {
  // ───────────────────────────────────────────────────────────────
  // getAdminDashboardStats
  // ───────────────────────────────────────────────────────────────
  async getAdminDashboardStats(supabase: SupabaseClient<Database>): Promise<AdminDashboardStats> {
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
  },

  // ───────────────────────────────────────────────────────────────
  // getChapterActivityList
  // ───────────────────────────────────────────────────────────────
  async getChapterActivityList(supabase: SupabaseClient<Database>): Promise<ChapterActivityItem[]> {
    const { data: chapters, error } = await supabase
      .from('chapter')
      .select('id, name, university')
      .order('name', { ascending: true })

    if (error || !chapters) {
      logger.error({ context: 'getChapterActivityList', error: error }, 'Failed')
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
  },

  // ───────────────────────────────────────────────────────────────
  // getRecentJoins
  // ───────────────────────────────────────────────────────────────
  async getRecentJoins(supabase: SupabaseClient<Database>, limit = 10): Promise<RecentJoinItem[]> {
    const { data: users, error } = await supabase
      .from('user')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !users) {
      logger.error({ context: 'getRecentJoins', error: error }, 'Failed')
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
  },

  // ───────────────────────────────────────────────────────────────
  // getPendingRecruiterRequests
  // ───────────────────────────────────────────────────────────────
  async getPendingRecruiterRequests(supabase: SupabaseClient<Database>): Promise<PendingRecruiterRequestItem[]> {
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
      logger.error({ context: 'getPendingRecruiterRequests', error: error }, 'Failed')
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
  },

  // ───────────────────────────────────────────────────────────────
  // getSystemStats
  // ───────────────────────────────────────────────────────────────
  async getSystemStats(supabase: SupabaseClient<Database>) {
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
      if (r.error) logger.error({ context: 'getSystemStats', queryIndex: i, error: r.error }, `Query ${i} failed`)
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
  },

  // ───────────────────────────────────────────────────────────────
  // getRecentActivity
  // ───────────────────────────────────────────────────────────────
  async getRecentActivity(supabase: SupabaseClient<Database>) {
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
  },

  // ───────────────────────────────────────────────────────────────
  // getChapters
  // ───────────────────────────────────────────────────────────────
  async getChapters(supabase: SupabaseClient<Database>): Promise<ChapterWithCount[]> {
    const { data: chapters, error } = await supabase
      .from('chapter')
      .select(CHAPTER_SELECT)
      .order('name', { ascending: true })

    if (error || !chapters) {
      logger.error({ context: 'Failed', error: error }, 'Failed to fetch chapters')
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
  },

  // ───────────────────────────────────────────────────────────────
  // getChapterMembers
  // ───────────────────────────────────────────────────────────────
  async getChapterMembers(supabase: SupabaseClient<Database>, chapter_id: string): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from('student_profile')
      .select(ADMIN_PROFILE_SELECT)
      .eq('chapter_id', chapter_id)
      .order('created_at', { ascending: false })

    if (error || !data) {
      logger.error({ context: 'admin/getChapterMembers', error: error }, 'Error')
      return []
    }

    return (data as AdminProfileSummaryRow[])
      .map(mapAdminProfile)
      .filter((m): m is MemberWithProfile => m !== null)
  },

  // ───────────────────────────────────────────────────────────────
  // getChapterMemberCount
  // ───────────────────────────────────────────────────────────────
  async getChapterMemberCount(supabase: SupabaseClient<Database>, chapter_id: string): Promise<number> {
    const { count } = await supabase
      .from('student_profile')
      .select('user_id', { count: 'exact', head: true })
      .eq('chapter_id', chapter_id)

    return count ?? 0
  },

  // ───────────────────────────────────────────────────────────────
  // normalizeUserWithDetails
  // ───────────────────────────────────────────────────────────────
  normalizeUserWithDetails(users: UserWithDetailsRaw[]): UserWithDetails[] {
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
  },

  // ───────────────────────────────────────────────────────────────
  // getUsers
  // ───────────────────────────────────────────────────────────────
  async getUsers(supabase: SupabaseClient<Database>): Promise<UserWithDetails[]> {
    const { data: users, error: usersError } = await supabase
      .from('user')
      .select('id, email, name, role, phone, created_at, updated_at, deactivated_at')
      .order('created_at', { ascending: false })

    if (usersError || !users) {
      logger.error({ context: 'Failed', error: usersError }, 'Failed to fetch users')
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
      logger.error({ context: 'Failed', error: profilesError }, 'Failed to fetch profiles')
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

    return this.normalizeUserWithDetails(rawUsers as unknown as UserWithDetailsRaw[])
  },

  // ───────────────────────────────────────────────────────────────
  // getActivityLog
  // ───────────────────────────────────────────────────────────────
  async getActivityLog(supabase: SupabaseClient<Database>): Promise<ActivityItem[]> {
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
      logger.error({ context: 'getActivityLog', error: approvalsError }, 'Approvals error')
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
      logger.error({ context: 'getActivityLog', error: invitesError }, 'Invites error')
    }

    const activities: ActivityItem[] = []

    if (approvals) {
      ; (approvals as ActivityApprovalRow[]).forEach((approval: ActivityApprovalRow) => {
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
      ; (invites as ActivityInviteRow[]).forEach((invite: ActivityInviteRow) => {
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
  },

  // ───────────────────────────────────────────────────────────────
  // getCompanies
  // ───────────────────────────────────────────────────────────────
  async getCompanies(supabase: SupabaseClient<Database>): Promise<Company[]> {
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
      logger.error({ context: 'Failed', error: error }, 'Failed to fetch companies')
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
  },

  // ───────────────────────────────────────────────────────────────
  // getInvites
  // ───────────────────────────────────────────────────────────────
  async getInvites(supabase: SupabaseClient<Database>): Promise<RecruiterInvite[]> {
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
      logger.error({ context: 'Failed', error: error }, 'Failed to fetch invites')
      return []
    }

    return this.normalizeRecruiterInvites(invites as unknown as RecruiterInviteRaw[])
  },

  // ───────────────────────────────────────────────────────────────
  // normalizeRecruiterInvites
  // ───────────────────────────────────────────────────────────────
  normalizeRecruiterInvites(invites: RecruiterInviteRaw[]): RecruiterInvite[] {
    return invites.map((invite: RecruiterInviteRaw) => ({
      ...invite,
      company: Array.isArray(invite.company) ? (invite.company[0] ?? null) : null,
      granted_by: Array.isArray(invite.granted_by) ? (invite.granted_by[0] ?? null) : null,
      accepted_by: Array.isArray(invite.accepted_by) ? (invite.accepted_by[0] ?? null) : null,
    }))
  },

  // ───────────────────────────────────────────────────────────────
  // getUserById
  // ───────────────────────────────────────────────────────────────
  async getUserById(supabase: SupabaseClient<Database>, id: string): Promise<UserWithFullProfile | null> {
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
      logger.error({ context: 'getUserById', error }, 'Failed to fetch user')
      return null
    }

    const userRow = user as unknown as AdminUserByIdRow
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
  },

  // ───────────────────────────────────────────────────────────────
  // getChapterById
  // ───────────────────────────────────────────────────────────────
  async getChapterById(supabase: SupabaseClient<Database>, id: string): Promise<ChapterRow | null> {
    const { data: chapter, error } = await supabase
      .from('chapter')
      .select(CHAPTER_SELECT)
      .eq('id', id)
      .single()

    if (error) {
      logger.error({ context: 'Failed', error: error }, 'Failed to fetch chapter')
      return null
    }

    return chapter
  },

  async createChapter(
    supabase: SupabaseClient<Database>,
    params: {
      id: string
      name: string
      university: string
      city?: string | null
      region?: string | null
    }
  ): Promise<{ success: true; chapter: ChapterRow } | { success: false; error: string }> {
    const { data: existing } = await supabase
      .from('chapter')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Chapter ID already exists' }
    }

    const now = new Date().toISOString()

    const { data: chapter, error: insertError } = await supabase
      .from('chapter')
      .insert({
        id: params.id,
        name: params.name,
        university: params.university,
        city: params.city || null,
        region: params.region || null,
        created_at: now,
        updated_at: now,
      })
      .select(CHAPTER_SELECT)
      .single<ChapterRow>()

    if (insertError || !chapter) {
      logger.error({ context: 'Failed', error: insertError }, 'Failed to create chapter')
      return { success: false, error: 'Failed to create chapter' }
    }

    return { success: true, chapter }
  },

  async createCompany(
    supabase: SupabaseClient<Database>,
    params: { name: string; createdById: string }
  ): Promise<{ success: true; companyId: string } | { success: false; error: string }> {
    const { data, error } = await supabase
      .from('company')
      .insert({
        name: params.name.trim(),
        created_by_id: params.createdById,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A company with this name already exists' }
      }
      logger.error({ context: 'createCompany', error }, 'Failed to create company')
      return { success: false, error: 'Failed to create company' }
    }

    if (!data) {
      return { success: false, error: 'Failed to create company' }
    }

    return { success: true, companyId: data.id }
  },

  // ───────────────────────────────────────────────────────────────
  // queryFilteredUsers (internal users helper, exposed on service)
  // ───────────────────────────────────────────────────────────────
  async queryFilteredUsers(supabase: SupabaseClient<Database>, filters: UsersFilters): Promise<AdminUserListItem[]> {
    let userQuery = supabase.from('user').select('id, name, email, role, created_at, deactivated_at')

    const search = filters.search?.trim()
    if (search) {
      const escaped = search.replace(/[%_]/g, '\\$&')
      userQuery = userQuery.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
    }

    if (filters.roles && filters.roles.length > 0) {
      userQuery = userQuery.in('role', filters.roles)
    }

    const { data: users, error: usersError } = await userQuery.order('created_at', { ascending: false })
    if (usersError || !users) {
      return []
    }

    const typedUsers = users as Pick<UserRow, 'id' | 'name' | 'email' | 'role' | 'created_at' | 'deactivated_at'>[]
    const userIds = typedUsers.map((user) => user.id)
    if (userIds.length === 0) return []

    const { data: profiles, error: profilesError } = await supabase
      .from('student_profile')
      .select('user_id, chapter_id, is_filled, approval_status, chapter:chapter!student_profile_chapter_id_fkey(name)')
      .in('user_id', userIds)

    if (profilesError) {
      return []
    }

    const typedProfiles = (profiles ?? []) as AdminUsersProfileRow[]
    const profileMap = new Map<string, AdminUsersProfileSummary>(
      typedProfiles.map((profile) => [
        profile.user_id,
        {
          chapter_id: profile.chapter_id,
          chapter_name: Array.isArray(profile.chapter) ? profile.chapter[0]?.name ?? null : profile.chapter?.name ?? null,
          is_filled: profile.is_filled,
          approval_status: profile.approval_status,
        },
      ])
    )

    const rows = typedUsers.map<AdminUserListItem>((user) => {
      const profile = profileMap.get(user.id) ?? null
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        created_at: user.created_at,
        deactivated_at: user.deactivated_at ?? null,
        chapter_id: profile?.chapter_id ?? null,
        chapter_name: profile?.chapter_name ?? null,
        profile_status: toProfileStatus(
          profile
            ? {
              is_filled: profile.is_filled,
              approval_status: profile.approval_status,
            }
            : null
        ),
      }
    })

    return rows.filter((row) => {
      if (filters.chapter_ids && filters.chapter_ids.length > 0) {
        if (!row.chapter_id || !filters.chapter_ids.includes(row.chapter_id)) return false
      }

      if (filters.approval_statuses && filters.approval_statuses.length > 0) {
        if (!filters.approval_statuses.includes(row.profile_status)) return false
      }

      return true
    })
  },

  // ───────────────────────────────────────────────────────────────
  // getUsersList
  // ───────────────────────────────────────────────────────────────
  async getUsersList(
    supabase: SupabaseClient<Database>,
    filters: UsersFilters,
    pagination: UsersPagination
  ): Promise<UsersListResponse> {
    const rows = await this.queryFilteredUsers(supabase, filters)
    const sortBy = pagination.sortBy ?? 'created_at'
    const sortOrder = pagination.sortOrder ?? 'desc'
    const sorted = sortAdminUserRows(rows, sortBy, sortOrder)

    const safePage = Math.max(1, pagination.page)
    const start = (safePage - 1) * pagination.pageSize
    const end = start + pagination.pageSize

    return {
      items: sorted.slice(start, end),
      total: sorted.length,
      page: safePage,
      pageSize: pagination.pageSize,
    }
  },

  // ───────────────────────────────────────────────────────────────
  // updateUserRole
  // ───────────────────────────────────────────────────────────────
  async updateUserRole(supabase: SupabaseClient<Database>, userId: string, newRole: Role): Promise<ActionResult> {
    const { error } = await supabase.from('user').update({ role: newRole }).eq('id', userId)
    if (error) {
      return { success: false, error: 'Failed to update user role.' }
    }
    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // deactivateUser
  // ───────────────────────────────────────────────────────────────
  async deactivateUser(supabase: SupabaseClient<Database>, userId: string): Promise<ActionResult> {
    const { error } = await supabase
      .from('user')
      .update({ deactivated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) {
      return { success: false, error: 'Failed to deactivate user.' }
    }
    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // reactivateUser
  // ───────────────────────────────────────────────────────────────
  async reactivateUser(supabase: SupabaseClient<Database>, userId: string): Promise<ActionResult> {
    const { error } = await supabase.from('user').update({ deactivated_at: null }).eq('id', userId)
    if (error) {
      return { success: false, error: 'Failed to reactivate user.' }
    }
    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // bulkUpdateUsers
  // ───────────────────────────────────────────────────────────────
  async bulkUpdateUsers(supabase: SupabaseClient<Database>, userIds: string[], action: BulkAction): Promise<ActionResult> {
    if (userIds.length === 0) {
      return { success: false, error: 'No users selected.' }
    }

    if (action.type === 'change_role') {
      const { error } = await supabase.from('user').update({ role: action.role }).in('id', userIds)
      if (error) {
        return { success: false, error: 'Failed to update roles.' }
      }
    } else if (action.type === 'deactivate') {
      const { error } = await supabase
        .from('user')
        .update({ deactivated_at: new Date().toISOString() })
        .in('id', userIds)
      if (error) {
        return { success: false, error: 'Failed to deactivate users.' }
      }
    } else {
      const { error } = await supabase.from('user').update({ deactivated_at: null }).in('id', userIds)
      if (error) {
        return { success: false, error: 'Failed to reactivate users.' }
      }
    }

    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // exportUsersCSV
  // ───────────────────────────────────────────────────────────────
  async exportUsersCSV(supabase: SupabaseClient<Database>, filters: UsersFilters): Promise<string> {
    const rows = await this.queryFilteredUsers(supabase, filters)
    const header = [
      'Name',
      'Email',
      'Role',
      'Chapter',
      'Join Date',
      'Profile Status',
      'Deactivated At',
    ].join(',')

    const dataRows = rows.map((row) =>
      [
        csvCell(row.name),
        csvCell(row.email),
        csvCell(row.role),
        csvCell(row.chapter_name),
        csvCell(new Date(row.created_at).toISOString()),
        csvCell(row.profile_status),
        csvCell(row.deactivated_at),
      ].join(',')
    )

    return [header, ...dataRows].join('\n')
  },

  // ───────────────────────────────────────────────────────────────
  // getAdminEventsList
  // ───────────────────────────────────────────────────────────────
  async getAdminEventsList(
    supabase: SupabaseClient<Database>,
    filters: EventFilters,
    pagination: EventPagination
  ): Promise<AdminEventsListResponse> {
    let query = supabase
      .from('event')
      .select('id, title, start_at, end_at, is_published, chapter_id, capacity, chapter(name, university), event_chapter(id, chapter(name, university)), event_registration(id, status)')

    const search = filters.search?.trim()
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (filters.chapter_ids?.length) {
      query = query.in('chapter_id', filters.chapter_ids)
    }

    const { data, error } = await query
    if (error || !data) {
      logger.error({ context: 'admin/events', error: error }, 'getAdminEventsList error')
      return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
    }

    const rows: AdminEventListItem[] = data.map((row) => {
      const chapter = Array.isArray(row.chapter) ? row.chapter[0] : row.chapter
      const registrations = Array.isArray(row.event_registration)
        ? row.event_registration.filter((r: { status: string }) => r.status === 'registered').length
        : 0

      return {
        id: row.id,
        title: row.title,
        start_at: row.start_at,
        end_at: row.end_at,
        is_published: row.is_published,
        chapter_id: row.chapter_id,
        chapter_name: chapter?.name ?? null,
        registrations,
        capacity: row.capacity,
        chapter: chapter,
        event_chapter: Array.isArray(row.event_chapter) ? row.event_chapter : [],
      }
    })

    const filteredByStatus = rows.filter((row) => {
      if (!filters.statuses?.length) return true
      return filters.statuses.includes(getEventStatus(row))
    })

    const sortBy = (pagination.sortBy ?? 'startAt') as EventSortKey
    const sortOrder = pagination.sortOrder ?? 'desc'
    const sorted = sortAdminEventRows(filteredByStatus, sortBy, sortOrder)
    const page = Math.max(1, pagination.page)
    const start = (page - 1) * pagination.pageSize
    const end = start + pagination.pageSize

    return {
      items: sorted.slice(start, end),
      total: sorted.length,
      page,
      pageSize: pagination.pageSize,
    }
  },

  // ───────────────────────────────────────────────────────────────
  // getChaptersList
  // ───────────────────────────────────────────────────────────────
  async getChaptersList(
    supabase: SupabaseClient<Database>,
    filters: ChaptersFilters,
    pagination: ChaptersPagination
  ): Promise<ChaptersListResponse> {
    let query = supabase
      .from('chapter')
      .select('id, name, university, city, region, created_at, updated_at')

    const search = filters.search?.trim()
    if (search) {
      query = query.or(`name.ilike.%${search}%,university.ilike.%${search}%`)
    }

    const { data: chapters, error } = await query
    if (error || !chapters) {
      logger.error({ context: 'admin/chapters', error: error }, 'getChaptersList error')
      return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
    }

    const chapterRows = chapters as ChapterListRow[]
    const chapter_ids = chapterRows.map((chapter: ChapterListRow) => chapter.id)
    if (chapter_ids.length === 0) {
      return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
    }

    const now = new Date().toISOString()
    const [{ data: profiles }, { data: events }] = await Promise.all([
      supabase
        .from('student_profile')
        .select('chapter_id, user_id, user!student_profile_user_id_fkey(name, email, role)')
        .in('chapter_id', chapter_ids),
      supabase
        .from('event')
        .select('id, chapter_id')
        .in('chapter_id', chapter_ids)
        .eq('is_published', true)
        .gt('end_at', now),
    ])

    type ChapterProfileRow = Pick<StudentProfileRow, 'chapter_id' | 'user_id'> & {
      user:
        | Pick<UserRow, 'name' | 'email' | 'role'>
        | Pick<UserRow, 'name' | 'email' | 'role'>[]
        | null
    }
    type ChapterEventRow = Pick<EventRow, 'id' | 'chapter_id'>

    const profileRows = (profiles ?? []) as unknown as ChapterProfileRow[]
    const eventRows = (events ?? []) as unknown as ChapterEventRow[]

    const profileByChapter = new Map<string, ChapterProfileRow[]>()
    profileRows.forEach((profile: ChapterProfileRow) => {
      const list = profileByChapter.get(profile.chapter_id) ?? []
      list.push(profile)
      profileByChapter.set(profile.chapter_id, list)
    })

    const eventCountByChapter = new Map<string, number>()
    eventRows.forEach((event: ChapterEventRow) => {
      const current = eventCountByChapter.get(event.chapter_id ?? '') ?? 0
      eventCountByChapter.set(event.chapter_id ?? '', current + 1)
    })

    const rows: ChapterListItem[] = chapterRows.map((chapter: ChapterListRow) => {
      const chapterProfiles = profileByChapter.get(chapter.id) ?? []
      const editors = chapterProfiles
        .filter((profile: ChapterProfileRow) => {
          const user = Array.isArray(profile.user) ? profile.user[0] : profile.user
          return user?.role === 'editor'
        })
        .map((profile: ChapterProfileRow) => {
          const user = Array.isArray(profile.user) ? profile.user[0] : profile.user
          return {
            id: profile.user_id,
            name: user?.name ?? 'Unknown',
            email: user?.email ?? 'unknown@example.com',
          }
        })

      return {
        id: chapter.id,
        name: chapter.name,
        university: chapter.university,
        city: chapter.city,
        region: chapter.region,
        member_count: chapterProfiles.length,
        active_events_count: eventCountByChapter.get(chapter.id) ?? 0,
        editors,
      }
    })

    const sortBy = pagination.sortBy ?? 'name'
    const sortOrder = pagination.sortOrder ?? 'asc'
    const sorted = sortChapterRows(rows, sortBy, sortOrder)
    const page = Math.max(1, pagination.page)
    const start = (page - 1) * pagination.pageSize
    const end = start + pagination.pageSize

    return {
      items: sorted.slice(start, end),
      total: sorted.length,
      page,
      pageSize: pagination.pageSize,
    }
  },

  // ───────────────────────────────────────────────────────────────
  // updateChapter
  // ───────────────────────────────────────────────────────────────
  async updateChapter(
    supabase: SupabaseClient<Database>,
    id: string,
    input: { name: string; university: string; city?: string | null; region?: string | null }
  ): Promise<ActionResult> {
    const { error } = await supabase
      .from('chapter')
      .update({
        name: input.name,
        university: input.university,
        city: input.city || null,
        region: input.region || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logger.error({ context: 'admin/chapters', error: error }, 'updateChapter error')
      return { success: false, error: 'Failed to update chapter.' }
    }

    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // deleteChapter
  // ───────────────────────────────────────────────────────────────
  async deleteChapter(supabase: SupabaseClient<Database>, id: string): Promise<ActionResult> {
    const [{ count: membersCount }, { count: eventsCount }] = await Promise.all([
      supabase
        .from('student_profile')
        .select('user_id', { count: 'exact', head: true })
        .eq('chapter_id', id),
      supabase
        .from('event')
        .select('id', { count: 'exact', head: true })
        .eq('chapter_id', id),
    ])

    if ((membersCount ?? 0) > 0 || (eventsCount ?? 0) > 0) {
      return { success: false, error: 'Chapter cannot be deleted while it has members or events.' }
    }

    const { error } = await supabase.from('chapter').delete().eq('id', id)
    if (error) {
      logger.error({ context: 'admin/chapters', error: error }, 'deleteChapter error')
      return { success: false, error: 'Failed to delete chapter.' }
    }

    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // getAvailableEditors
  // ───────────────────────────────────────────────────────────────
  async getAvailableEditors(
    supabase: SupabaseClient<Database>,
    chapter_id: string
  ): Promise<{ id: string; name: string; email: string; role: 'member' | 'editor' }[]> {
    const { data, error } = await supabase
      .from('student_profile')
      .select('user_id, user!student_profile_user_id_fkey(id, name, email, role)')
      .eq('chapter_id', chapter_id)

    if (error) {
      logger.error({ context: 'admin/chapters', error: error }, 'getAvailableEditors error')
      return []
    }

    type AvailableEditorRow = Pick<StudentProfileRow, 'user_id'> & {
      user:
        | Pick<UserRow, 'id' | 'name' | 'email' | 'role'>
        | Pick<UserRow, 'id' | 'name' | 'email' | 'role'>[]
        | null
    }

    return ((data ?? []) as unknown as AvailableEditorRow[])
      .map((row: AvailableEditorRow) => {
        const user = Array.isArray(row.user) ? row.user[0] : row.user
        if (!user) return null
        if (user.role !== 'member' && user.role !== 'editor') return null
        return {
          id: user.id,
          name: user.name ?? 'Unknown',
          email: user.email,
          role: user.role,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  },

  // ───────────────────────────────────────────────────────────────
  // assignEditor
  // ───────────────────────────────────────────────────────────────
  async assignEditor(supabase: SupabaseClient<Database>, userId: string, chapter_id: string): Promise<ActionResult> {
    const { data: profile } = await supabase
      .from('student_profile')
      .select('user_id, chapter_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!profile || profile.chapter_id !== chapter_id) {
      return { success: false, error: 'User must be a member of this chapter.' }
    }

    const { error } = await supabase.from('user').update({ role: 'editor' }).eq('id', userId)
    if (error) {
      logger.error({ context: 'admin/chapters', error: error }, 'assignEditor error')
      return { success: false, error: 'Failed to assign editor.' }
    }

    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // removeEditor
  // ───────────────────────────────────────────────────────────────
  async removeEditor(supabase: SupabaseClient<Database>, userId: string, chapter_id: string): Promise<ActionResult> {
    const { data: profile } = await supabase
      .from('student_profile')
      .select('user_id, chapter_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!profile || profile.chapter_id !== chapter_id) {
      return { success: false, error: 'User does not belong to this chapter.' }
    }

    const { error } = await supabase.from('user').update({ role: 'member' }).eq('id', userId)
    if (error) {
      logger.error({ context: 'admin/chapters', error: error }, 'removeEditor error')
      return { success: false, error: 'Failed to remove editor.' }
    }

    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // getChapterStats
  // ───────────────────────────────────────────────────────────────
  async getChapterStats(supabase: SupabaseClient<Database>, id: string) {
    const now = new Date().toISOString()
    const [{ count: members }, { count: publishedActiveEvents }, { count: totalEvents }] = await Promise.all([
      supabase
        .from('student_profile')
        .select('user_id', { count: 'exact', head: true })
        .eq('chapter_id', id),
      supabase
        .from('event')
        .select('id', { count: 'exact', head: true })
        .eq('chapter_id', id)
        .eq('is_published', true)
        .gt('end_at', now),
      supabase
        .from('event')
        .select('id', { count: 'exact', head: true })
        .eq('chapter_id', id),
    ])

    return {
      member_count: members ?? 0,
      active_events_count: publishedActiveEvents ?? 0,
      totalEvents: totalEvents ?? 0,
    }
  },

  // ───────────────────────────────────────────────────────────────
  // getCompaniesList
  // ───────────────────────────────────────────────────────────────
  async getCompaniesList(
    supabase: SupabaseClient<Database>,
    filters: CompaniesFilters,
    pagination: CompaniesPagination
  ): Promise<CompaniesListResponse> {
    const now = new Date().toISOString()

    let query = supabase
      .from('company')
      .select('id, name, created_at, created_by_id, created_by:user!company_created_by_id_fkey(name)')

    const search = filters.search?.trim()
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: companies, error } = await query
    if (error || !companies) {
      logger.error({ context: 'admin/companies', error: error }, 'getCompaniesList error')
      return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
    }

    type CompanyListRow = Pick<CompanyRow, 'id' | 'name' | 'created_at' | 'created_by_id'> & {
      created_by: Pick<UserRow, 'name'> | Pick<UserRow, 'name'>[] | null
    }
    type CompanyAccessRow = Pick<
      RecruiterAccessRow,
      'id' | 'company_id' | 'is_active' | 'accepted_at' | 'revoked_at' | 'invite_expires_at'
    >

    const companyRows = companies as CompanyListRow[]
    const ids = companyRows.map((company: CompanyListRow) => company.id)
    const { data: accessRows } = await supabase
      .from('recruiter_access')
      .select('id, company_id, is_active, accepted_at, revoked_at, invite_expires_at')
      .in('company_id', ids)

    const recruiterAccessRows = (accessRows ?? []) as unknown as CompanyAccessRow[]

    const rows: CompanyListItem[] = companyRows.map((company: CompanyListRow) => {
      const companyAccess = recruiterAccessRows.filter((row: CompanyAccessRow) => row.company_id === company.id)
      const active_recruiters = companyAccess.filter((row: CompanyAccessRow) => row.is_active && !row.revoked_at).length
      const pending_invites = companyAccess.filter(
        (row: CompanyAccessRow) =>
          !row.accepted_at &&
          !row.revoked_at &&
          (row.invite_expires_at === null || row.invite_expires_at > now)
      ).length

      const createdBy = Array.isArray(company.created_by) ? company.created_by[0] : company.created_by
      return {
        id: company.id,
        name: company.name,
        created_at: company.created_at,
        created_by_name: createdBy?.name ?? null,
        active_recruiters,
        pending_invites,
      }
    })

    const sortBy = pagination.sortBy ?? 'created_at'
    const sortOrder = pagination.sortOrder ?? 'desc'
    const sorted = sortCompanyRows(rows, sortBy, sortOrder)
    const page = Math.max(1, pagination.page)
    const start = (page - 1) * pagination.pageSize
    const end = start + pagination.pageSize

    return {
      items: sorted.slice(start, end),
      total: sorted.length,
      page,
      pageSize: pagination.pageSize,
    }
  },

  // ───────────────────────────────────────────────────────────────
  // getCompanyById
  // ───────────────────────────────────────────────────────────────
  async getCompanyById(supabase: SupabaseClient<Database>, id: string): Promise<CompanyDetail | null> {
    const { data: company, error } = await supabase
      .from('company')
      .select('id, name, created_at, created_by_id, created_by:user!company_created_by_id_fkey(name)')
      .eq('id', id)
      .maybeSingle()

    if (error || !company) {
      logger.error({ context: 'admin/companies', error: error }, 'getCompanyById company error')
      return null
    }

    const { data: recruiters, error: recruitersError } = await supabase
      .from('recruiter_access')
      .select('id, recruiter_email, is_active, invite_token, invite_expires_at, accepted_at, accepted_by_user_id, revoked_at, granted_at')
      .eq('company_id', id)
      .order('granted_at', { ascending: false })

    if (recruitersError) {
      logger.error({ context: 'admin/companies', error: recruitersError }, 'getCompanyById recruiters error')
    }

    const rawCreatedBy = (company as unknown as { created_by?: { name: string } | { name: string }[] | null }).created_by
    const createdBy = Array.isArray(rawCreatedBy) ? rawCreatedBy[0] : rawCreatedBy
    return {
      id: company.id,
      name: company.name,
      created_at: company.created_at,
      created_by_name: createdBy?.name ?? null,
      recruiters: recruiters ?? [],
    }
  },

  // ───────────────────────────────────────────────────────────────
  // updateCompany
  // ───────────────────────────────────────────────────────────────
  async updateCompany(supabase: SupabaseClient<Database>, id: string, name: string): Promise<ActionResult> {
    const { error } = await supabase.from('company').update({ name }).eq('id', id)
    if (error) {
      logger.error({ context: 'admin/companies', error: error }, 'updateCompany error')
      return { success: false, error: 'Failed to update company.' }
    }
    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // deleteCompany
  // ───────────────────────────────────────────────────────────────
  async deleteCompany(supabase: SupabaseClient<Database>, id: string): Promise<ActionResult> {
    const now = new Date().toISOString()

    const { count } = await supabase
      .from('recruiter_access')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', id)
      .or(`is_active.eq.true,and(accepted_at.is.null,revoked_at.is.null,invite_expires_at.is.null),and(accepted_at.is.null,revoked_at.is.null,invite_expires_at.gt.${now})`)

    if ((count ?? 0) > 0) {
      return { success: false, error: 'Cannot delete company with active recruiters or pending invites.' }
    }

    const { error } = await supabase.from('company').delete().eq('id', id)
    if (error) {
      logger.error({ context: 'admin/companies', error: error }, 'deleteCompany error')
      return { success: false, error: 'Failed to delete company.' }
    }
    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // generateInviteToken
  // ───────────────────────────────────────────────────────────────
  async generateInviteToken(
    supabase: SupabaseClient<Database>,
    userId: string,
    companyId: string,
    recruiterEmail: string,
    expiresInDays: 7 | 30 | null
  ): Promise<InviteResult> {
    const token = crypto.randomUUID()
    const { error } = await supabase.from('recruiter_access').insert({
      company_id: companyId,
      recruiter_email: recruiterEmail,
      granted_by_id: userId,
      invite_token: token,
      invite_expires_at: getExpiryDate(expiresInDays),
      is_active: false,
    })

    if (error) {
      logger.error({ context: 'admin/companies', error: error }, 'generateInviteToken error')
      return { success: false, error: 'Failed to create invite token.' }
    }

    return { success: true, inviteLink: generateInviteLink(token) }
  },

  // ───────────────────────────────────────────────────────────────
  // revokeAccess
  // ───────────────────────────────────────────────────────────────
  async revokeAccess(supabase: SupabaseClient<Database>, userId: string, accessId: string): Promise<ActionResult> {
    const { error } = await supabase
      .from('recruiter_access')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by_id: userId,
        is_active: false,
      })
      .eq('id', accessId)

    if (error) {
      logger.error({ context: 'admin/companies', error: error }, 'revokeAccess error')
      return { success: false, error: 'Failed to revoke access.' }
    }
    return { success: true }
  },

  // ───────────────────────────────────────────────────────────────
  // resendCompanyInvite
  // ───────────────────────────────────────────────────────────────
  async resendCompanyInvite(supabase: SupabaseClient<Database>, accessId: string): Promise<InviteResult> {
    const { data: access } = await supabase
      .from('recruiter_access')
      .select('id, company_id, accepted_at, revoked_at')
      .eq('id', accessId)
      .maybeSingle()

    if (!access) return { success: false, error: 'Invite not found.' }
    if (access.accepted_at) return { success: false, error: 'Invite already accepted.' }
    if (access.revoked_at) return { success: false, error: 'Invite already revoked.' }

    const token = crypto.randomUUID()
    const { error } = await supabase
      .from('recruiter_access')
      .update({
        invite_token: token,
        invite_expires_at: getExpiryDate(7),
      })
      .eq('id', accessId)

    if (error) {
      logger.error({ context: 'admin/companies', error: error }, 'resendInvite error')
      return { success: false, error: 'Failed to regenerate invite token.' }
    }

    return { success: true, inviteLink: generateInviteLink(token) }
  },

  // ───────────────────────────────────────────────────────────────
  // getCompanyStats
  // ───────────────────────────────────────────────────────────────
  async getCompanyStats(supabase: SupabaseClient<Database>, id: string) {
    const now = new Date().toISOString()
    const [{ count: active_recruiters }, { count: pending_invites }] = await Promise.all([
      supabase
        .from('recruiter_access')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', id)
        .eq('is_active', true)
        .is('revoked_at', null),
      supabase
        .from('recruiter_access')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', id)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .or(`invite_expires_at.is.null,invite_expires_at.gt.${now}`),
    ])

    return {
      active_recruiters: active_recruiters ?? 0,
      pending_invites: pending_invites ?? 0,
      totalViews: 0,
      totalDownloads: 0,
    }
  },

  // ───────────────────────────────────────────────────────────────
  // createRecruiterInvite
  // ───────────────────────────────────────────────────────────────
  async validateCompanyExists(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<{ id: string; name: string } | null> {
    const { data, error } = await supabase
      .from('company')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (error || !data) {
      return null
    }

    return data
  },

  async checkExistingRecruiterInvite(
    supabase: SupabaseClient<Database>,
    email: string,
    companyId: string
  ): Promise<{ id: string; accepted_at: string | null; revoked_at: string | null } | null> {
    const { data, error } = await supabase
      .from('recruiter_access')
      .select('id, accepted_at, revoked_at')
      .eq('recruiter_email', email)
      .eq('company_id', companyId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data as { id: string; accepted_at: string | null; revoked_at: string | null }
  },

  async createRecruiterInvite(
    supabase: SupabaseClient<Database>,
    userId: string,
    params: {
      recruiterEmail: string
      companyId: string
      expiresInDays?: number
    }
  ): Promise<{ success: true; inviteId: string; token: string } | { success: false; error: string }> {
    const token = crypto.randomUUID()
    const expiresInDays = params.expiresInDays || 7
    const { data: invite, error: inviteError } = await supabase
      .from('recruiter_access')
      .insert({
        recruiter_email: params.recruiterEmail,
        company_id: params.companyId,
        granted_by_id: userId,
        granted_at: new Date().toISOString(),
        invite_token: token,
        invite_expires_at: getExpiryDate(expiresInDays),
        is_active: false,
      })
      .select('id')
      .single()

    if (inviteError || !invite) {
      logger.error({ context: 'AdminService.createRecruiterInvite', error: inviteError }, 'insert error')
      return { success: false, error: inviteError?.message ?? 'Failed to create invite' }
    }

    return { success: true, inviteId: invite.id, token }
  },

  // ───────────────────────────────────────────────────────────────
  // regenerateInviteToken
  // ───────────────────────────────────────────────────────────────
  async regenerateInviteToken(
    supabase: SupabaseClient<Database>,
    accessId: string
  ): Promise<{ success: true; token: string } | { success: false; error: string }> {
    const { data: access } = await supabase
      .from('recruiter_access')
      .select('id, accepted_at, revoked_at')
      .eq('id', accessId)
      .maybeSingle()

    if (!access) return { success: false, error: 'Invite not found' }
    if (access.accepted_at) return { success: false, error: 'Invite already accepted' }
    if (access.revoked_at) return { success: false, error: 'Invite already revoked' }

    const token = crypto.randomUUID()
    const { error } = await supabase
      .from('recruiter_access')
      .update({
        invite_token: token,
        invite_expires_at: getExpiryDate(7),
      })
      .eq('id', accessId)

    if (error) {
      logger.error({ context: 'AdminService.regenerateInviteToken', error: error }, 'update error')
      return { success: false, error: 'Failed to regenerate invite token' }
    }

    return { success: true, token }
  },

  // ───────────────────────────────────────────────────────────────
  // revokeInvite
  // ───────────────────────────────────────────────────────────────
  async revokeInvite(supabase: SupabaseClient<Database>, userId: string, accessId: string): Promise<ActionResult> {
    const { data: invite } = await supabase
      .from('recruiter_access')
      .select('id, revoked_at')
      .eq('id', accessId)
      .maybeSingle()

    if (!invite) return { success: false, error: 'Invite not found' }
    if (invite.revoked_at) return { success: false, error: 'Invite already revoked' }

    const { error } = await supabase
      .from('recruiter_access')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by_id: userId,
        is_active: false,
      })
      .eq('id', accessId)

    if (error) {
      logger.error({ context: 'AdminService.revokeInvite', error: error }, 'update error')
      return { success: false, error: 'Failed to revoke invite' }
    }

    return { success: true }
  },

  /**
   * Get invite details for resending (includes company name).
   */
  async getInviteForResend(
    supabase: SupabaseClient<Database>,
    inviteId: string
  ): Promise<
    | {
        id: string
        recruiter_email: string
        company_id: string
        revoked_at: string | null
        accepted_at: string | null
        company: { name: string } | null
      }
    | null
  > {
    const { data, error } = await supabase
      .from('recruiter_access')
      .select('id, recruiter_email, company_id, revoked_at, accepted_at, company(name)')
      .eq('id', inviteId)
      .single()

    if (error || !data) {
      return null
    }

    const company = Array.isArray((data as Record<string, unknown>).company)
      ? ((data as Record<string, unknown>).company as unknown[])[0]
      : (data as Record<string, unknown>).company

    return {
      id: String((data as Record<string, unknown>).id),
      recruiter_email: String((data as Record<string, unknown>).recruiter_email),
      company_id: String((data as Record<string, unknown>).company_id),
      revoked_at: ((data as Record<string, unknown>).revoked_at as string | null) ?? null,
      accepted_at: ((data as Record<string, unknown>).accepted_at as string | null) ?? null,
      company: company
        ? {
            name: String((company as Record<string, unknown>).name),
          }
        : null,
    }
  },

  /**
   * Get basic invite details for revoke validation.
   */
  async getInviteForRevoke(
    supabase: SupabaseClient<Database>,
    inviteId: string
  ): Promise<
    | {
        id: string
        recruiter_email: string
        company_id: string
        revoked_at: string | null
      }
    | null
  > {
    const { data, error } = await supabase
      .from('recruiter_access')
      .select('id, recruiter_email, company_id, revoked_at')
      .eq('id', inviteId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: String((data as Record<string, unknown>).id),
      recruiter_email: String((data as Record<string, unknown>).recruiter_email),
      company_id: String((data as Record<string, unknown>).company_id),
      revoked_at: ((data as Record<string, unknown>).revoked_at as string | null) ?? null,
    }
  },

  /**
   * Delete a recruiter invite by ID.
   */
  async deleteInvite(
    supabase: SupabaseClient<Database>,
    inviteId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('recruiter_access').delete().eq('id', inviteId)

    if (error) {
      logger.error({ context: 'AdminService.deleteInvite', error: error }, 'error')
      return { success: false, error: 'Failed to delete invite' }
    }

    return { success: true }
  },

  /**
   * Get all chapters ordered by name (for dropdowns).
   */
  async getAllChapters(
    supabase: SupabaseClient<Database>
  ): Promise<{ chapters: Array<Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'created_at' | 'updated_at' | 'instagram_url' | 'latitude' | 'longitude' | 'location_point'>> } | { error: string }> {
    const { data, error } = await supabase
      .from('chapter')
      .select('id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point')
      .order('name', { ascending: true })

    if (error || !data) {
      logger.error({ context: 'Failed', error: error }, 'Failed to fetch chapters')
      return { error: 'Failed to fetch chapters' }
    }

    return { chapters: data }
  },
}
