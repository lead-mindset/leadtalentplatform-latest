import { describe, expect, it, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { ChapterMembershipService } from '../chapter-membership.service'

type MockFn = ReturnType<typeof vi.fn>

type TableMock = {
  select?: MockFn
  upsert?: MockFn
  update?: MockFn
  match?: MockFn
  eq?: MockFn
  order?: MockFn
  maybeSingle?: MockFn
}

function buildMockSupabase(overrides: Record<string, TableMock> = {}) {
  const tableMocks: Record<string, TableMock> = {
    chapter_membership: {
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn(),
      update: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
      maybeSingle: vi.fn(),
    },
    ...overrides,
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

describe('ChapterMembershipService', () => {
  describe('applyToChapter', () => {
    it('creates an explicit pending chapter membership application', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.upsert?.mockResolvedValue({ error: null })

      const result = await ChapterMembershipService.applyToChapter(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({ success: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('chapter_membership')
      expect(tableMocks.chapter_membership.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          chapter_id: 'leaduni',
          status: 'pending',
          position: 'member',
        }),
        { onConflict: 'user_id,chapter_id' }
      )
    })

    it('returns a friendly duplicate-membership error from database uniqueness', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.upsert?.mockResolvedValue({
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })

      const result = await ChapterMembershipService.applyToChapter(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({
        success: false,
        error: 'User already has an active approved chapter membership.',
      })
    })
  })

  describe('approveMembership', () => {
    it('approves the matching pending membership row by user and chapter', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { id: 'membership-1', status: 'pending', member_id: null },
        error: null,
      })

      const generateMemberId = vi.fn().mockResolvedValue('LEAD-123456')
      const result = await ChapterMembershipService.approveMembership(
        mockSupabase as unknown as SupabaseClient,
        {
          userId: 'user-1',
          chapterId: 'leaduni',
          approverId: 'editor-1',
          generateMemberId,
        }
      )

      expect(result).toEqual({ success: true, member_id: 'LEAD-123456' })
      expect(tableMocks.chapter_membership.select).toHaveBeenCalledWith('id, status, member_id')
      expect(tableMocks.chapter_membership.match).toHaveBeenCalledWith({
        user_id: 'user-1',
        chapter_id: 'leaduni',
      })
      expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approved_by_id: 'editor-1',
          status: 'approved',
          position: 'member',
          member_id: 'LEAD-123456',
        })
      )
    })

    it('rejects approval when the matching membership does not exist', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({ data: null, error: null })

      const result = await ChapterMembershipService.approveMembership(
        mockSupabase as unknown as SupabaseClient,
        {
          userId: 'user-1',
          chapterId: 'leaduni',
          approverId: 'editor-1',
          generateMemberId: vi.fn(),
        }
      )

      expect(result).toEqual({ success: false, error: 'Membership application not found.' })
      expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    })
  })

  describe('getChapterRoster', () => {
    it('returns roster rows with membership chapter and position details', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.order?.mockResolvedValue({
        data: [
          {
            user_id: 'user-1',
            chapter_id: 'leaduni',
            status: 'approved',
            position: 'president',
            member_id: 'LEAD-123456',
            joined_at: '2026-05-03T00:00:00.000Z',
            user: { id: 'user-1', email: 'member@test.com', name: 'Test Member', phone: null, role: 'member', created_at: '2026-05-03', updated_at: '2026-05-03', deactivated_at: null },
            person_profile: { user_id: 'user-1', major_or_interest: 'Engineering', graduation_year: 2027, linkedin_url: null, skills: [], is_recruiter_visible: true, updated_at: '2026-05-03', created_at: '2026-05-03', gender: null },
            chapter: { id: 'leaduni', name: 'LEAD UNI', university: 'UNI', city: 'Lima', region: 'Lima', created_at: '2026-05-03', updated_at: '2026-05-03', instagram_url: null, latitude: null, longitude: null, location_point: null },
          },
        ],
        error: null,
      })

      const result = await ChapterMembershipService.getChapterRoster(
        mockSupabase as unknown as SupabaseClient,
        'leaduni'
      )

      expect(result).toHaveLength(1)
      expect(result[0].chapter_membership).toEqual(
        expect.objectContaining({
          chapter_id: 'leaduni',
          status: 'approved',
          position: 'president',
          member_id: 'LEAD-123456',
        })
      )
      expect(result[0].chapter?.name).toBe('LEAD UNI')
    })
  })

  describe('membership state helpers', () => {
    it('marks a membership as alumni', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const result = await ChapterMembershipService.markAlumni(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({ success: true })
      expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'alumni' })
      )
    })

    it('confirms editor eligibility only for approved memberships', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1' },
        error: null,
      })

      const result = await ChapterMembershipService.ensureCanBecomeEditor(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({ success: true })
      expect(tableMocks.chapter_membership.match).toHaveBeenCalledWith({
        user_id: 'user-1',
        chapter_id: 'leaduni',
        status: 'approved',
      })
    })
  })
})
