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
  const buildMockSupabase = (overrides: Record<string, any> = {}) => {
    // Chain for select queries: .select().eq().single() or .select().in()
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn(),
    }

    // Chain for update queries: .update().eq()
    const updateChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    }

    const tableMocks: Record<string, any> = {
      student_profile: {
        select: vi.fn().mockReturnValue(selectChain),
        update: vi.fn().mockReturnValue(updateChain),
        upsert: vi.fn(),
        _selectChain: selectChain,
        _updateChain: updateChain,
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

      const result = await ChapterService.approveMember(mockSupabase as any, 'user-123', 'approver-1')

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

      const result = await ChapterService.approveMember(mockSupabase as any, 'user-123', 'approver-1')

      expect(result).toEqual({ success: false, error: 'Profile not found' })
      expect(generateUniqueMemberId).not.toHaveBeenCalled()
    })

    it('should return error when profile is incomplete', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.student_profile._selectChain.single.mockResolvedValueOnce({
        data: { is_filled: false, chapter_id: 'ch-1' },
        error: null,
      })

      const result = await ChapterService.approveMember(mockSupabase as any, 'user-123', 'approver-1')

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

      const result = await ChapterService.approveMember(mockSupabase as any, 'user-123', 'approver-1')

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

      const result = await ChapterService.approveMember(mockSupabase as any, 'user-123', 'approver-1')

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
        mockSupabase as any,
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
        mockSupabase as any,
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
        mockSupabase as any,
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
        mockSupabase as any,
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
        mockSupabase as any,
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
        mockSupabase as any,
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

      const result = await ChapterService.rejectMember(mockSupabase as any, 'user-123')

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

      const result = await ChapterService.rejectMember(mockSupabase as any, 'user-123')

      expect(result).toEqual({ success: false, error: 'Failed to reject member' })
    })
  })

  // ───────────────────────────────────────────────────────────────
  // revokeApproval
  // ───────────────────────────────────────────────────────────────
  describe('revokeApproval', () => {
    it('should revoke approval successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const result = await ChapterService.revokeApproval(mockSupabase as any, 'user-123')

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

      const result = await ChapterService.revokeApproval(mockSupabase as any, 'user-123')

      expect(result).toEqual({ success: false, error: 'Failed to revoke approval' })
    })
  })
})
