import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { ChapterMembershipService } from '../chapter-membership.service'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    hasChapterPermission: vi.fn(),
  },
}))

type MockFn = ReturnType<typeof vi.fn>

type TableMock = {
  select?: MockFn
  upsert?: MockFn
  insert?: MockFn
  update?: MockFn
  match?: MockFn
  eq?: MockFn
  in?: MockFn
  order?: MockFn
  maybeSingle?: MockFn
}

function buildMockSupabase(overrides: Record<string, TableMock> = {}) {
  const tableMocks: Record<string, TableMock> = {
    chapter_membership: {
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn(),
      insert: vi.fn(),
      update: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn(),
      maybeSingle: vi.fn(),
    },
    person_profile: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
    user: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
    chapter: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
    chapter_role_assignment: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    },
    chapter_audit_log: {
      insert: vi.fn().mockResolvedValue({ error: null }),
    },
    ...overrides,
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

describe('ChapterMembershipService', () => {
  beforeEach(() => {
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockReset()
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(true)
  })

  describe('applyToChapter', () => {
    it('creates an explicit pending chapter membership application', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.person_profile.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1' },
        error: null,
      })
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({ data: null, error: null })
      tableMocks.chapter_membership.insert?.mockResolvedValue({ error: null })

      const result = await ChapterMembershipService.applyToChapter(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({ success: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('person_profile')
      expect(mockSupabase.from).toHaveBeenCalledWith('chapter_membership')
      expect(tableMocks.chapter_membership.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          chapter_id: 'leaduni',
          status: 'pending',
          position: 'member',
        })
      )
    })

    it('returns a friendly duplicate-membership error from database uniqueness', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.person_profile.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1' },
        error: null,
      })
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({ data: null, error: null })
      tableMocks.chapter_membership.insert?.mockResolvedValue({
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

    it('requires a basic person profile before creating an application', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.person_profile.maybeSingle?.mockResolvedValue({ data: null, error: null })

      const result = await ChapterMembershipService.applyToChapter(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({
        success: false,
        error: 'Basic profile must be completed before applying to a chapter.',
      })
      expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
    })

    it('treats an existing pending application as idempotent success', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.person_profile.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1' },
        error: null,
      })
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1', chapter_id: 'leaduni', status: 'pending' },
        error: null,
      })

      const result = await ChapterMembershipService.applyToChapter(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({ success: true })
      expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
      expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    })

    it('moves a rejected same-chapter application back to pending', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.person_profile.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1' },
        error: null,
      })
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1', chapter_id: 'leaduni', status: 'rejected' },
        error: null,
      })

      const result = await ChapterMembershipService.applyToChapter(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({ success: true })
      expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          member_id: null,
          approved_by_id: null,
        })
      )
    })

    it('does not overwrite an approved membership application', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.person_profile.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1' },
        error: null,
      })
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { user_id: 'user-1', chapter_id: 'leaduni', status: 'approved' },
        error: null,
      })

      const result = await ChapterMembershipService.applyToChapter(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni' }
      )

      expect(result).toEqual({
        success: false,
        error: 'User already has an active approved chapter membership.',
      })
      expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
      expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    })
  })

  describe('approveMembership', () => {
    it('approves the matching pending membership row by user and chapter', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle
        ?.mockResolvedValueOnce({
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

    it('denies approval for an editor from another chapter', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)

      const result = await ChapterMembershipService.approveMembership(
        mockSupabase as unknown as SupabaseClient,
        {
          userId: 'user-1',
          chapterId: 'leaduni',
          approverId: 'editor-1',
          generateMemberId: vi.fn(),
        }
      )

      expect(result).toEqual({
        success: false,
        error: 'You do not have permission to approve chapter memberships.',
      })
      expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    })

    it('always approves applicants as member through the editor path', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { id: 'membership-1', status: 'pending', member_id: null },
        error: null,
      })

      await ChapterMembershipService.approveMembership(
        mockSupabase as unknown as SupabaseClient,
        {
          userId: 'user-1',
          chapterId: 'leaduni',
          approverId: 'admin-1',
          generateMemberId: vi.fn().mockResolvedValue('LEAD-123456'),
        }
      )

      expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
        expect.objectContaining({ position: 'member' })
      )
    })
  })

  describe('rejectMembership', () => {
    it('rejects a pending membership for a same-chapter editor', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle
        ?.mockResolvedValueOnce({ data: { id: 'membership-1', status: 'pending' }, error: null })

      const result = await ChapterMembershipService.rejectMembership(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni', managerId: 'editor-1' }
      )

      expect(result).toEqual({ success: true })
      expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approved_by_id: null,
          status: 'rejected',
          member_id: null,
        })
      )
    })

    it('rejects rejection when the target membership is not pending', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { id: 'membership-1', status: 'approved' },
        error: null,
      })

      const result = await ChapterMembershipService.rejectMembership(
        mockSupabase as unknown as SupabaseClient,
        { userId: 'user-1', chapterId: 'leaduni', managerId: 'admin-1' }
      )

      expect(result).toEqual({
        success: false,
        error: 'Only pending memberships can be rejected.',
      })
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
      tableMocks.user.in?.mockResolvedValue({
        data: [
          { id: 'user-1', email: 'member@test.com', name: 'Test Member', phone: null, role: 'member', created_at: '2026-05-03', updated_at: '2026-05-03', deactivated_at: null },
        ],
        error: null,
      })
      tableMocks.person_profile.in?.mockResolvedValue({
        data: [
          { id: 'profile-1', user_id: 'user-1', major_or_interest: 'Engineering', graduation_year: 2027, linkedin_url: null, portfolio_url: null, skills: [], is_recruiter_visible: true, updated_at: '2026-05-03', created_at: '2026-05-03', gender: null, university: 'UNI' },
        ],
        error: null,
      })
      tableMocks.chapter.maybeSingle?.mockResolvedValue({
        data: { id: 'leaduni', name: 'LEAD UNI', university: 'UNI', city: 'Lima', region: 'Lima', created_at: '2026-05-03', updated_at: '2026-05-03', instagram_url: null, latitude: null, longitude: null, location_point: null },
        error: null,
      })
      tableMocks.chapter_role_assignment.order
        ?.mockImplementationOnce(() => tableMocks.chapter_role_assignment)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'role-1',
              user_id: 'user-1',
              chapter_id: 'leaduni',
              role_level: 'director',
              functional_area: 'marketing_communications',
              display_title: 'Directora de Marketing',
              status: 'active',
              is_primary: true,
              starts_at: '2026-05-03T00:00:00.000Z',
              ends_at: null,
              assigned_by_id: 'leader-1',
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
      expect(result[0].chapter_role_assignment).toEqual(
        expect.objectContaining({
          id: 'role-1',
          role_level: 'director',
          functional_area: 'marketing_communications',
          display_title: 'Directora de Marketing',
        })
      )
    })
  })

  describe('membership state helpers', () => {
    it('revokes an approved membership into inactive status with an audit record', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      tableMocks.chapter_membership.maybeSingle?.mockResolvedValue({
        data: { id: 'membership-1', status: 'approved' },
        error: null,
      })

      const result = await ChapterMembershipService.revokeMembership(
        mockSupabase as unknown as SupabaseClient,
        {
          userId: 'user-1',
          chapterId: 'leaduni',
          managerId: 'president-1',
          reason: 'No longer active in chapter',
        }
      )

      expect(result).toEqual({ success: true })
      expect(ChapterPermissionService.hasChapterPermission).toHaveBeenCalledWith(
        mockSupabase,
        {
          userId: 'president-1',
          chapterId: 'leaduni',
          permissionKey: 'chapter.members.revoke',
        }
      )
      expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          approved_by_id: null,
          status: 'inactive',
          member_id: null,
        })
      )
      expect(tableMocks.chapter_audit_log.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'chapter.membership.revoked',
          actor_user_id: 'president-1',
          target_user_id: 'user-1',
          chapter_id: 'leaduni',
          entity_type: 'chapter_membership',
          entity_id: 'membership-1',
          metadata: {
            reason: 'No longer active in chapter',
            previous_status: 'approved',
          },
        })
      )
    })

    it('requires a reason to revoke membership', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const result = await ChapterMembershipService.revokeMembership(
        mockSupabase as unknown as SupabaseClient,
        {
          userId: 'user-1',
          chapterId: 'leaduni',
          managerId: 'president-1',
          reason: '   ',
        }
      )

      expect(result).toEqual({ success: false, error: 'A revocation reason is required.' })
      expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    })

    it('denies revocation without the scoped revoke permission', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)

      const result = await ChapterMembershipService.revokeMembership(
        mockSupabase as unknown as SupabaseClient,
        {
          userId: 'user-1',
          chapterId: 'leaduni',
          managerId: 'coordinator-1',
          reason: 'Not active',
        }
      )

      expect(result).toEqual({
        success: false,
        error: 'You do not have permission to revoke chapter memberships.',
      })
      expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    })

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
