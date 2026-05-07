import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  resolveActivationDashboard,
  StudentDashboardService,
  type StudentDashboardMembership,
} from '../student-dashboard.service'
import type { ChapterRow, PersonProfileRow } from '@/lib/types'

type MockFn = ReturnType<typeof vi.fn>

type TableMock = {
  select: MockFn
  eq?: MockFn
  order?: MockFn
  maybeSingle?: MockFn
}

const baseProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  university: 'Universidad Nacional',
  major_or_interest: 'Product',
  graduation_year: 2027,
  linkedin_url: null,
  portfolio_url: null,
  skills: ['research'],
  gender: null,
  is_recruiter_visible: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
} satisfies PersonProfileRow

function chapter(id = 'leaduni') {
  return {
    id,
    name: id === 'leaduni' ? 'LEAD UNI' : 'LEAD PUCP',
    university: id === 'leaduni' ? 'Universidad Nacional de Ingenieria' : 'PUCP',
  } satisfies Pick<ChapterRow, 'id' | 'name' | 'university'>
}

function membership(
  status: StudentDashboardMembership['status'],
  overrides: Partial<StudentDashboardMembership> = {}
): StudentDashboardMembership {
  return {
    chapter_id: overrides.chapter_id ?? 'leaduni',
    status,
    position: overrides.position ?? 'member',
    member_id: overrides.member_id ?? null,
    joined_at: overrides.joined_at ?? null,
    created_at: overrides.created_at ?? '2026-01-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-01-01T00:00:00.000Z',
    chapter: overrides.chapter === undefined ? chapter(overrides.chapter_id) : overrides.chapter,
  }
}

function buildMockSupabase(params: {
  profile?: PersonProfileRow | null
  memberships?: unknown[]
  chapters?: Array<Pick<ChapterRow, 'id' | 'name' | 'university'>>
}) {
  const tableMocks: Record<string, TableMock> = {
    person_profile: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: params.profile ?? null, error: null }),
    },
    chapter_membership: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: params.memberships ?? [], error: null }),
    },
    chapter: {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: params.chapters ?? [], error: null }),
    },
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

describe('StudentDashboardService', () => {
  describe('resolveActivationDashboard', () => {
    it('maps no membership to participant status', () => {
      const result = resolveActivationDashboard({ profile: baseProfile, memberships: [] })

      expect(result).toMatchObject({
        status: 'participant',
        hasProfile: true,
        membership: null,
      })
    })

    it('maps pending membership to pending review status', () => {
      const result = resolveActivationDashboard({
        profile: baseProfile,
        memberships: [membership('pending')],
      })

      expect(result.status).toBe('pending')
      expect(result.membership?.member_id).toBeNull()
    })

    it('maps approved membership to official member status with member ID', () => {
      const result = resolveActivationDashboard({
        profile: baseProfile,
        memberships: [membership('approved', { member_id: 'LEAD-123456' })],
      })

      expect(result.status).toBe('official_member')
      expect(result.membership?.member_id).toBe('LEAD-123456')
    })

    it('maps alumni membership to alumni status without application push', () => {
      const result = resolveActivationDashboard({
        profile: baseProfile,
        memberships: [membership('alumni', { member_id: 'LEAD-654321' })],
      })

      expect(result.status).toBe('alumni')
      expect(result.membership?.status).toBe('alumni')
    })

    it('treats rejected-only memberships as participant state', () => {
      const result = resolveActivationDashboard({
        profile: baseProfile,
        memberships: [membership('rejected')],
      })

      expect(result.status).toBe('participant')
      expect(result.membership).toBeNull()
    })

    it('prioritizes approved over pending or rejected rows', () => {
      const result = resolveActivationDashboard({
        profile: baseProfile,
        memberships: [
          membership('rejected', { chapter_id: 'leadpucp', chapter: chapter('leadpucp') }),
          membership('pending', { chapter_id: 'leadpucp', chapter: chapter('leadpucp') }),
          membership('approved', { member_id: 'LEAD-777777' }),
        ],
      })

      expect(result.status).toBe('official_member')
      expect(result.membership?.chapter_id).toBe('leaduni')
    })

    it('prioritizes pending over rejected rows', () => {
      const result = resolveActivationDashboard({
        profile: baseProfile,
        memberships: [membership('rejected'), membership('pending', { chapter_id: 'leadpucp' })],
      })

      expect(result.status).toBe('pending')
      expect(result.membership?.chapter_id).toBe('leadpucp')
    })
  })

  describe('getActivationDashboard', () => {
    it('reads profile and memberships through Supabase', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase({
        profile: baseProfile,
        memberships: [membership('pending')],
      })

      const result = await StudentDashboardService.getActivationDashboard(
        mockSupabase as unknown as SupabaseClient,
        'user-1'
      )

      expect(result.status).toBe('pending')
      expect(mockSupabase.from).toHaveBeenCalledWith('person_profile')
      expect(mockSupabase.from).toHaveBeenCalledWith('chapter_membership')
      expect(tableMocks.person_profile.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(tableMocks.chapter_membership.eq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('returns chapter application options ordered by name', async () => {
      const chapters = [chapter('leadpucp'), chapter('leaduni')]
      const { mockSupabase, tableMocks } = buildMockSupabase({ chapters })

      const result = await StudentDashboardService.getChapterApplicationOptions(
        mockSupabase as unknown as SupabaseClient
      )

      expect(result).toEqual(chapters)
      expect(mockSupabase.from).toHaveBeenCalledWith('chapter')
      expect(tableMocks.chapter.order).toHaveBeenCalledWith('name', { ascending: true })
    })
  })
})
