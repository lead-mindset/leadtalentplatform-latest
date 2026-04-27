import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChapterService } from '../chapter.service'
import { SupabaseClient } from '@supabase/supabase-js'

// ───────────────────────────────────────────────────────────────
// Mock generateUniqueMemberId
// ───────────────────────────────────────────────────────────────
vi.mock('@/lib/utils/member-id', () => ({
  generateUniqueMemberId: vi.fn(),
}))

import { generateUniqueMemberId } from '@/lib/utils/member-id'

/**
 * ChapterService Tests
 *
 * Mocks follow event.service.test.ts pattern:
 * - SupabaseClient with chained .fn().mockReturnThis()
 * - Per-table mock chains routed via from(table)
 *
 * Key insight: `.eq()` appears in BOTH select chains (returns this for .single())
 * AND update chains (returns Promise). We use separate chain objects.
 */

describe('ChapterService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateUniqueMemberId).mockReset()
  })

  // ───────────────────────────────────────────────────────────────
  // Helper: Build a Supabase mock that routes `from(table)` calls
  // ───────────────────────────────────────────────────────────────
  interface MockSelectChain {
    eq: ReturnType<typeof vi.fn>
    in: ReturnType<typeof vi.fn>
    single: ReturnType<typeof vi.fn>
  }

  interface MockUpdateChain {
    eq: ReturnType<typeof vi.fn>
  }

  interface TableMock {
    select?: ReturnType<typeof vi.fn>
    update?: ReturnType<typeof vi.fn>
    upsert?: ReturnType<typeof vi.fn>
    _selectChain?: MockSelectChain
    _updateChain?: MockUpdateChain
  }

  const buildMockSupabase = (overrides: Record<string, unknown> = {}) => {
    // Chain for select queries: .select().eq().single() or .select().in()
    const selectChain: MockSelectChain = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn(),
    }

    // Chain for update queries: .update().eq()
    const updateChain: MockUpdateChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    }

    const tableMocks: Record<string, TableMock> = {
      student_profile: {
        select: vi.fn().mockReturnValue(selectChain),
        update: vi.fn().mockReturnValue(updateChain),
        upsert: vi.fn(),
        _selectChain: selectChain,
        _updateChain: updateChain,
      },
      user: {
        select: vi.fn().mockReturnValue(selectChain),
        _selectChain: selectChain,
      },
      chapter: {
        select: vi.fn().mockReturnValue(selectChain),
        _selectChain: selectChain,
      },
      ...overrides,
    }

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
    } as unknown as SupabaseClient

    return { mockSupabase, tableMocks }
  }

  // ───────────────────────────────────────────────────────────────
  // approveMember
  // ───────────────────────────────────────────────────────────────
  describe('approveMember', () => {
    it('should approve a member when profile is complete', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { is_filled: true, chapter_id: 'ch-1' },
        error: null,
      })

      vi.mocked(generateUniqueMemberId).mockResolvedValue('LEAD-123456')

      const result = await ChapterService.approveMember(mockSupabase as unknown as SupabaseClient, 'user-123', 'approver-1')

      expect(result).toEqual({ success: true, member_id: 'LEAD-123456' })
      expect(mockSupabase.from).toHaveBeenCalledWith('student_profile')
      expect(tableMocks.student_profile.select).toHaveBeenCalledWith('is_filled, chapter_id')
      expect(tableMocks.student_profile._selectChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(generateUniqueMemberId).toHaveBeenCalledWith(mockSupabase)
      expect(tableMocks.student_profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approved_by_id: 'approver-1',
          approval_status: 'approved',
          member_id: 'LEAD-123456',
          is_recruiter_visible: true,
        })
      )
      expect(tableMocks.student_profile._updateChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return error when profile is not found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Row not found' },
      })

      const result = await ChapterService.approveMember(mockSupabase as unknown as SupabaseClient, 'user-123', 'approver-1')

      expect(result).toEqual({ success: false, error: 'Profile not found' })
      expect(generateUniqueMemberId).not.toHaveBeenCalled()
    })

    it('should return error when profile is incomplete', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { is_filled: false, chapter_id: 'ch-1' },
        error: null,
      })

      const result = await ChapterService.approveMember(mockSupabase as unknown as SupabaseClient, 'user-123', 'approver-1')

      expect(result).toEqual({ success: false, error: 'Cannot approve incomplete profile' })
      expect(generateUniqueMemberId).not.toHaveBeenCalled()
    })

    it('should return error when member ID generation fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { is_filled: true, chapter_id: 'ch-1' },
        error: null,
      })

      vi.mocked(generateUniqueMemberId).mockRejectedValue(new Error('Too many collisions'))

      const result = await ChapterService.approveMember(mockSupabase as unknown as SupabaseClient, 'user-123', 'approver-1')

      expect(result).toEqual({
        success: false,
        error: 'Could not generate a member ID — please try again.',
      })
    })

    it('should return error when profile update fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { is_filled: true, chapter_id: 'ch-1' },
        error: null,
      })

      vi.mocked(generateUniqueMemberId).mockResolvedValue('LEAD-123456')

      tableMocks.student_profile._updateChain.eq.mockResolvedValueOnce({
        error: { message: 'Database error' },
      })

      const result = await ChapterService.approveMember(mockSupabase as unknown as SupabaseClient, 'user-123', 'approver-1')

      expect(result).toEqual({ success: false, error: 'Failed to approve member' })
    })
  })

  // ───────────────────────────────────────────────────────────────
  // approveMembersBulk
  // ───────────────────────────────────────────────────────────────
  describe('approveMembersBulk', () => {
    it('should approve multiple eligible members', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.in.mockResolvedValueOnce({
        data: [
          { user_id: 'user-1', chapter_id: 'ch-1', is_filled: true },
          { user_id: 'user-2', chapter_id: 'ch-1', is_filled: true },
        ],
        error: null,
      })

      // single() called twice inside approveMember (once per user)
      tableMocks.student_profile._selectChain.single
        .mockResolvedValueOnce({ data: { is_filled: true, chapter_id: 'ch-1' }, error: null })
        .mockResolvedValueOnce({ data: { is_filled: true, chapter_id: 'ch-1' }, error: null })

      vi.mocked(generateUniqueMemberId)
        .mockResolvedValueOnce('LEAD-111111')
        .mockResolvedValueOnce('LEAD-222222')

      const result = await ChapterService.approveMembersBulk(
        mockSupabase as unknown as SupabaseClient,
        ['user-1', 'user-2'],
        'approver-1',
        'ch-1'
      )

      expect(result.success).toBe(true)
      expect(result.count).toBe(2)
      expect(result.skipped).toBe(0)
      expect(generateUniqueMemberId).toHaveBeenCalledTimes(2)
    })

    it('should skip members from different chapters when chapterId is provided', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.in.mockResolvedValueOnce({
        data: [
          { user_id: 'user-1', chapter_id: 'ch-1', is_filled: true },
          { user_id: 'user-2', chapter_id: 'ch-2', is_filled: true },
        ],
        error: null,
      })

      // single() called once for the one valid member
      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { is_filled: true, chapter_id: 'ch-1' },
        error: null,
      })

      vi.mocked(generateUniqueMemberId).mockResolvedValueOnce('LEAD-111111')

      const result = await ChapterService.approveMembersBulk(
        mockSupabase as unknown as SupabaseClient,
        ['user-1', 'user-2'],
        'approver-1',
        'ch-1'
      )

      expect(result.count).toBe(1)
      expect(result.skipped).toBe(1)
    })

    it('should skip incomplete profiles', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.in.mockResolvedValueOnce({
        data: [
          { user_id: 'user-1', chapter_id: 'ch-1', is_filled: true },
          { user_id: 'user-2', chapter_id: 'ch-1', is_filled: false },
        ],
        error: null,
      })

      // single() called once for the one valid member
      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { is_filled: true, chapter_id: 'ch-1' },
        error: null,
      })

      vi.mocked(generateUniqueMemberId).mockResolvedValueOnce('LEAD-111111')

      const result = await ChapterService.approveMembersBulk(
        mockSupabase as unknown as SupabaseClient,
        ['user-1', 'user-2'],
        'approver-1',
        'ch-1'
      )

      expect(result.count).toBe(1)
      expect(result.skipped).toBe(1)
    })

    it('should return error when candidates query fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.in.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await ChapterService.approveMembersBulk(
        mockSupabase as unknown as SupabaseClient,
        ['user-1'],
        'approver-1',
        null
      )

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].error).toBe('Failed to load selected members')
    })

    it('should return error when all members are ineligible', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.in.mockResolvedValueOnce({
        data: [
          { user_id: 'user-1', chapter_id: 'ch-2', is_filled: true },
          { user_id: 'user-2', chapter_id: 'ch-2', is_filled: false },
        ],
        error: null,
      })

      const result = await ChapterService.approveMembersBulk(
        mockSupabase as unknown as SupabaseClient,
        ['user-1', 'user-2'],
        'approver-1',
        'ch-1'
      )

      expect(result.success).toBe(false)
      expect(result.count).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].error).toBe('No eligible members selected')
    })

    it('should handle partial failures gracefully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.in.mockResolvedValueOnce({
        data: [
          { user_id: 'user-1', chapter_id: 'ch-1', is_filled: true },
          { user_id: 'user-2', chapter_id: 'ch-1', is_filled: true },
        ],
        error: null,
      })

      // single() called twice (once per user in approveMember)
      tableMocks.student_profile._selectChain.single
        .mockResolvedValueOnce({ data: { is_filled: true, chapter_id: 'ch-1' }, error: null })
        .mockResolvedValueOnce({ data: { is_filled: true, chapter_id: 'ch-1' }, error: null })

      vi.mocked(generateUniqueMemberId)
        .mockResolvedValueOnce('LEAD-111111')
        .mockRejectedValueOnce(new Error('Collision'))

      const result = await ChapterService.approveMembersBulk(
        mockSupabase as unknown as SupabaseClient,
        ['user-1', 'user-2'],
        'approver-1',
        'ch-1'
      )

      expect(result.success).toBe(false)
      expect(result.count).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].error).toBe(
        'Could not generate a member ID — please try again.'
      )
    })
  })

  // ───────────────────────────────────────────────────────────────
  // rejectMember
  // ───────────────────────────────────────────────────────────────
  describe('rejectMember', () => {
    it('should reject a member successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const result = await ChapterService.rejectMember(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).toEqual({ success: true })
      expect(tableMocks.student_profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approval_status: 'rejected',
          member_id: null,
          is_recruiter_visible: false,
        })
      )
      expect(tableMocks.student_profile._updateChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return error when update fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._updateChain.eq.mockResolvedValueOnce({
        error: { message: 'Database error' },
      })

      const result = await ChapterService.rejectMember(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).toEqual({ success: false, error: 'Failed to reject member' })
    })
  })

  // ───────────────────────────────────────────────────────────────
  // revokeApproval
  // ───────────────────────────────────────────────────────────────
  describe('revokeApproval', () => {
    it('should revoke approval successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const result = await ChapterService.revokeApproval(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).toEqual({ success: true })
      expect(tableMocks.student_profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approved_by_id: null,
          approval_status: 'pending',
          member_id: null,
          is_recruiter_visible: false,
        })
      )
      expect(tableMocks.student_profile._updateChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return error when update fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._updateChain.eq.mockResolvedValueOnce({
        error: { message: 'Database error' },
      })

      const result = await ChapterService.revokeApproval(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).toEqual({ success: false, error: 'Failed to revoke approval' })
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getStudentChapterId
  // ───────────────────────────────────────────────────────────────
  describe('getStudentChapterId', () => {
    it('should return chapter id when profile exists', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { chapter_id: 'ch-1' },
        error: null,
      })

      const result = await ChapterService.getStudentChapterId(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).toBe('ch-1')
    })

    it('should return null when profile not found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await ChapterService.getStudentChapterId(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getUserBasicInfo
  // ───────────────────────────────────────────────────────────────
  describe('getUserBasicInfo', () => {
    it('should return user info when found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._selectChain.single.mockResolvedValueOnce({
        data: { email: 'user@test.com', name: 'User Name' },
        error: null,
      })

      const result = await ChapterService.getUserBasicInfo(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).not.toBeNull()
      expect(result?.email).toBe('user@test.com')
      expect(result?.name).toBe('User Name')
    })

    it('should return null when user not found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._selectChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await ChapterService.getUserBasicInfo(mockSupabase as unknown as SupabaseClient, 'user-123')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getChapterName
  // ───────────────────────────────────────────────────────────────
  describe('getChapterName', () => {
    it('should return chapter name when found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.chapter._selectChain.single.mockResolvedValueOnce({
        data: { name: 'Alpha Chapter' },
        error: null,
      })

      const result = await ChapterService.getChapterName(mockSupabase as unknown as SupabaseClient, 'ch-1')

      expect(result).toBe('Alpha Chapter')
    })

    it('should return null when chapter not found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.chapter._selectChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await ChapterService.getChapterName(mockSupabase as unknown as SupabaseClient, 'ch-missing')

      expect(result).toBeNull()
    })
  })
})
