import { describe, it, expect, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { PersonProfileService } from '../person-profile.service'

describe('PersonProfileService', () => {
  interface TableMock {
    select?: ReturnType<typeof vi.fn>
    update?: ReturnType<typeof vi.fn>
    upsert?: ReturnType<typeof vi.fn>
    eq?: ReturnType<typeof vi.fn>
    single?: ReturnType<typeof vi.fn>
    maybeSingle?: ReturnType<typeof vi.fn>
  }

  interface MockSupabase {
    from: ReturnType<typeof vi.fn>
    rpc: ReturnType<typeof vi.fn>
  }

  const buildMockSupabase = (overrides: Record<string, unknown> = {}) => {
    const tableMocks: Record<string, TableMock> = {
      user: {
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
      },
      person_profile: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        upsert: vi.fn(),
      },
      chapter_membership: {
        select: vi.fn(),
        upsert: vi.fn(),
      },
      ...overrides,
    }

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
      rpc: vi.fn().mockReturnThis(),
    } as unknown as SupabaseClient & { rpc: ReturnType<typeof vi.fn> }

    return { mockSupabase, tableMocks }
  }

  const baseParams = {
    userId: 'user-123',
    email: 'participant@test.com',
    fullName: 'Public Participant',
    phone: '+1234567890',
    university: 'Universidad Nacional',
    majorOrInterest: 'Product Design',
    graduationYear: 2027,
    linkedinUrl: 'https://linkedin.com/in/public',
    portfolioUrl: 'https://portfolio.test/public',
    skills: ['Figma', 'Research'],
    gender: 'prefer_not_to_say',
    isRecruiterVisible: false,
  }

  describe('getBasicProfile', () => {
    it('returns reusable user and person_profile fields', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user.maybeSingle?.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'participant@test.com',
          name: 'Public Participant',
          phone: '+1234567890',
        },
        error: null,
      })
      tableMocks.person_profile.single?.mockResolvedValue({
        data: {
          user_id: 'user-123',
          lead_id: null,
          university: 'Universidad Nacional',
          major_or_interest: 'Product Design',
          graduation_year: 2027,
          linkedin_url: 'https://linkedin.com/in/public',
          portfolio_url: 'https://portfolio.test/public',
          skills: ['Figma', 'Research'],
          gender: 'prefer_not_to_say',
          is_recruiter_visible: false,
        },
        error: null,
      })

      const result = await PersonProfileService.getBasicProfile(
        mockSupabase as unknown as SupabaseClient,
        'user-123'
      )

      expect(result).toEqual({
        userId: 'user-123',
        email: 'participant@test.com',
        fullName: 'Public Participant',
        phone: '+1234567890',
        leadId: null,
        university: 'Universidad Nacional',
        majorOrInterest: 'Product Design',
        graduationYear: 2027,
        linkedinUrl: 'https://linkedin.com/in/public',
        portfolioUrl: 'https://portfolio.test/public',
        skills: ['Figma', 'Research'],
        gender: 'prefer_not_to_say',
        isRecruiterVisible: false,
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('user')
      expect(mockSupabase.from).toHaveBeenCalledWith('person_profile')
      expect(tableMocks.chapter_membership.select).not.toHaveBeenCalled()
    })

    it('returns null when the person_profile row does not exist', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user.maybeSingle?.mockResolvedValue({
        data: { id: 'user-123', email: 'participant@test.com', name: null, phone: null },
        error: null,
      })
      tableMocks.person_profile.single?.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      })

      await expect(
        PersonProfileService.getBasicProfile(mockSupabase as unknown as SupabaseClient, 'user-123')
      ).resolves.toBeNull()
    })
  })

  describe('upsertBasicProfile', () => {
    it('upserts user and person_profile without chapter_membership', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user.eq?.mockResolvedValue({ error: null })
      tableMocks.person_profile.upsert?.mockReturnThis()
      tableMocks.person_profile.select?.mockReturnThis()
      tableMocks.person_profile.single?.mockResolvedValue({
        data: { id: 'profile-1', lead_id: null },
        error: null,
      })

      const result = await PersonProfileService.upsertBasicProfile(
        mockSupabase as unknown as SupabaseClient,
        baseParams
      )

      expect(result).toEqual({ success: true, data: { id: 'profile-1', lead_id: null } })
      expect(tableMocks.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'participant@test.com',
          name: 'Public Participant',
          phone: '+1234567890',
        }),
        { onConflict: 'id' }
      )
      expect(tableMocks.person_profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          university: 'Universidad Nacional',
          major_or_interest: 'Product Design',
          graduation_year: 2027,
          linkedin_url: 'https://linkedin.com/in/public',
          portfolio_url: 'https://portfolio.test/public',
          skills: ['Figma', 'Research'],
          gender: 'prefer_not_to_say',
          is_recruiter_visible: false,
        }),
        { onConflict: 'user_id' }
      )
      expect(tableMocks.chapter_membership.upsert).not.toHaveBeenCalled()
    })

    it('returns an error when user upsert fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user.eq?.mockResolvedValue({ error: { message: 'User write failed' } })

      const result = await PersonProfileService.upsertBasicProfile(
        mockSupabase as unknown as SupabaseClient,
        baseParams
      )

      expect(result).toEqual({ success: false, error: 'User write failed' })
      expect(tableMocks.person_profile.upsert).not.toHaveBeenCalled()
    })

    it('returns an error when profile upsert fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user.eq?.mockResolvedValue({ error: null })
      tableMocks.person_profile.upsert?.mockReturnThis()
      tableMocks.person_profile.select?.mockReturnThis()
      tableMocks.person_profile.single?.mockResolvedValue({
        data: null,
        error: { message: 'Profile write failed' },
      })

      const result = await PersonProfileService.upsertBasicProfile(
        mockSupabase as unknown as SupabaseClient,
        baseParams
      )

      expect(result).toEqual({ success: false, error: 'Profile write failed' })
    })
  })

  describe('issueLeadId', () => {
    it('returns lead_id on success', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile.select?.mockReturnThis()
      tableMocks.person_profile.eq?.mockReturnThis()
      tableMocks.person_profile.single?.mockResolvedValue({
        data: { id: 'profile-1' },
        error: null,
      })
      mockSupabase.rpc.mockResolvedValue({
        data: 'LEAD-000001',
        error: null,
      })

      const result = await PersonProfileService.issueLeadId(
        mockSupabase as unknown as SupabaseClient,
        'user-123'
      )

      expect(result).toEqual({ success: true, data: 'LEAD-000001' })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('issue_lead_id', {
        p_person_id: 'profile-1',
      })
    })

    it('returns error when profile is not found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile.select?.mockReturnThis()
      tableMocks.person_profile.eq?.mockReturnThis()
      tableMocks.person_profile.single?.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await PersonProfileService.issueLeadId(
        mockSupabase as unknown as SupabaseClient,
        'user-unknown'
      )

      expect(result).toEqual({ success: false, error: 'Not found' })
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('returns error when rpc fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile.select?.mockReturnThis()
      tableMocks.person_profile.eq?.mockReturnThis()
      tableMocks.person_profile.single?.mockResolvedValue({
        data: { id: 'profile-1' },
        error: null,
      })
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Sequence error' },
      })

      const result = await PersonProfileService.issueLeadId(
        mockSupabase as unknown as SupabaseClient,
        'user-123'
      )

      expect(result).toEqual({ success: false, error: 'Sequence error' })
    })
  })
})
