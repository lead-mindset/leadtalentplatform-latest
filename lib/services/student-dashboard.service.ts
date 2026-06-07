import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import type { ChapterMembershipRow, ChapterRow, PersonProfileRow } from '@/lib/types'
import { logger } from '@/lib/logger'

export type StudentActivationStatus = 'participant' | 'pending' | 'official_member' | 'alumni'
export type StudentDashboardLoadState = 'ready' | 'unavailable'

export type StudentDashboardMembership = Pick<
  ChapterMembershipRow,
  'chapter_id' | 'status' | 'position' | 'member_id' | 'joined_at' | 'created_at' | 'updated_at'
> & {
  chapter: Pick<ChapterRow, 'id' | 'name' | 'university'> | null
}

export type StudentDashboardChapterOption = Pick<ChapterRow, 'id' | 'name' | 'university'>

export type StudentActivationDashboard = {
  status: StudentActivationStatus
  profile: PersonProfileRow | null
  membership: StudentDashboardMembership | null
  hasProfile: boolean
  loadState: StudentDashboardLoadState
  loadError?: string
}

export type StudentChapterOptionsResult =
  | { success: true; data: StudentDashboardChapterOption[] }
  | { success: false; data: []; error: string }

type MembershipWithChapter = Omit<StudentDashboardMembership, 'chapter'> & {
  chapter:
    | Pick<ChapterRow, 'id' | 'name' | 'university'>
    | Pick<ChapterRow, 'id' | 'name' | 'university'>[]
    | null
}

const PROFILE_SELECT = `
  id,
  user_id,
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
`

const MEMBERSHIP_SELECT = `
  chapter_id,
  status,
  position,
  member_id,
  joined_at,
  created_at,
  updated_at,
  chapter:chapter_id (
    id,
    name,
    university
  )
`

function first<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function normalizeMembership(row: MembershipWithChapter): StudentDashboardMembership {
  return {
    chapter_id: row.chapter_id,
    status: row.status,
    position: row.position,
    member_id: row.member_id,
    joined_at: row.joined_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    chapter: first(row.chapter),
  }
}

function chooseMembership(
  memberships: StudentDashboardMembership[]
): StudentDashboardMembership | null {
  return (
    memberships.find((membership) => membership.status === 'approved') ??
    memberships.find((membership) => membership.status === 'pending') ??
    memberships.find((membership) => membership.status === 'alumni') ??
    null
  )
}

function statusForMembership(
  membership: StudentDashboardMembership | null
): StudentActivationStatus {
  if (!membership) return 'participant'
  if (membership.status === 'approved') return 'official_member'
  if (membership.status === 'pending') return 'pending'
  if (membership.status === 'alumni') return 'alumni'
  return 'participant'
}

export function resolveActivationDashboard(params: {
  profile: PersonProfileRow | null
  memberships: StudentDashboardMembership[]
  loadState?: StudentDashboardLoadState
  loadError?: string
}): StudentActivationDashboard {
  const membership = chooseMembership(params.memberships)

  return {
    status: statusForMembership(membership),
    profile: params.profile,
    membership,
    hasProfile: Boolean(params.profile),
    loadState: params.loadState ?? 'ready',
    loadError: params.loadError,
  }
}

export const StudentDashboardService = {
  async getActivationDashboard(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<StudentActivationDashboard> {
    const { data: profile, error: profileError } = await supabase
      .from('person_profile')
      .select(PROFILE_SELECT)
      .eq('user_id', userId)
      .maybeSingle()

    const { data: memberships, error: membershipsError } = await supabase
      .from('chapter_membership')
      .select(MEMBERSHIP_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const loadErrors = [
      profileError ? 'profile' : null,
      membershipsError ? 'memberships' : null,
    ].filter((value): value is string => Boolean(value))

    if (profileError) {
      logger.error({ context: 'StudentDashboardService.getActivationDashboard', error: profileError }, 'Profile load error')
    }
    if (membershipsError) {
      logger.error({ context: 'StudentDashboardService.getActivationDashboard', error: membershipsError }, 'Membership load error')
    }

    return resolveActivationDashboard({
      profile: profileError ? null : (profile ?? null) as PersonProfileRow | null,
      memberships: membershipsError ? [] : ((memberships ?? []) as unknown as MembershipWithChapter[]).map(normalizeMembership),
      loadState: loadErrors.length ? 'unavailable' : 'ready',
      loadError: loadErrors.length ? `No se pudo cargar: ${loadErrors.join(', ')}.` : undefined,
    })
  },

  async getChapterApplicationOptionsResult(
    supabase: SupabaseClient<Database>
  ): Promise<StudentChapterOptionsResult> {
    const { data, error } = await supabase
      .from('chapter')
      .select('id, name, university')
      .order('name', { ascending: true })

    if (error) {
      logger.error({ context: 'StudentDashboardService.getChapterApplicationOptions', error }, 'Chapter options load error')
      return { success: false, data: [], error: 'No se pudieron cargar los capítulos disponibles.' }
    }

    return { success: true, data: (data ?? []) as StudentDashboardChapterOption[] }
  },

  async getChapterApplicationOptions(
    supabase: SupabaseClient<Database>
  ): Promise<StudentDashboardChapterOption[]> {
    const result = await this.getChapterApplicationOptionsResult(supabase)
    return result.data
  },
}
