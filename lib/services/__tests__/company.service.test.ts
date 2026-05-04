import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CompanyService } from '../company.service'
import { SupabaseClient } from '@supabase/supabase-js'

// ───────────────────────────────────────────────────────────────
// Helper: Build a thenable Supabase query builder mock
// ───────────────────────────────────────────────────────────────
const buildMockSupabase = (overrides: Record<string, unknown> = {}) => {
  const createBuilder = () => {
    let defaultValue: unknown = { data: null, error: null }
    const valueQueue: unknown[] = []

    const shiftValue = () => {
      if (valueQueue.length > 0) return valueQueue.shift()!
      return defaultValue
    }

    const builder: Record<string, unknown> = {
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      or: vi.fn(() => builder),
      ilike: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      order: vi.fn(() => builder),
      contains: vi.fn(() => builder),
      is: vi.fn(() => builder),
      maybeSingle: vi.fn(() => Promise.resolve(shiftValue())),
      single: vi.fn(() => Promise.resolve(shiftValue())),
      then: vi.fn((resolve: (value: unknown) => unknown) => resolve(shiftValue())),
      _setThenValue: (value: unknown) => {
        valueQueue.push(value)
        defaultValue = value
      },
    }

    return builder
  }

  const userBuilder = createBuilder()
  const studentProfileBuilder = createBuilder()
  const savedStudentBuilder = createBuilder()
  const recruiterAccessBuilder = createBuilder()

  const tableMocks: Record<string, unknown> = {
    user: {
      select: vi.fn(() => userBuilder),
      update: vi.fn(() => userBuilder),
      _builder: userBuilder,
    },
    person_profile: {
      select: vi.fn(() => studentProfileBuilder),
      _builder: studentProfileBuilder,
    },
    saved_student: {
      select: vi.fn(() => savedStudentBuilder),
      insert: vi.fn(() => savedStudentBuilder),
      delete: vi.fn(() => savedStudentBuilder),
      _builder: savedStudentBuilder,
    },
    recruiter_access: {
      select: vi.fn(() => recruiterAccessBuilder),
      _builder: recruiterAccessBuilder,
    },
    ...overrides,
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

describe('CompanyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ───────────────────────────────────────────────────────────────
  // getStudentById
  // ───────────────────────────────────────────────────────────────
  describe('getStudentById', () => {
    it('should return a visible student', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: {
          id: 'student-1',
          email: 'student@test.com',
          name: 'Student',
          phone: null,
          created_at: '2024-01-01',
          person_profile: {
            major_or_interest: 'CS',
            graduation_year: 2025,
            linkedin_url: null,
            skills: ['React'],
            is_recruiter_visible: true,
            updated_at: '2024-01-01',
            chapter_membership: {
              chapter_id: 'ch-1',
              chapter: { name: 'MIT', university: 'MIT', city: 'Cambridge', region: 'MA' },
            },
          },
        },
        error: null,
      })

      const result = await CompanyService.getStudentById(mockSupabase as unknown as SupabaseClient, 'student-1')

      expect(result).not.toBeNull()
      expect(result?.name).toBe('Student')
      expect(result?.person_profile?.is_recruiter_visible).toBe(true)
    })

    it('should return null for invisible student', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: {
          id: 'student-1',
          email: 'student@test.com',
          name: 'Student',
          phone: null,
          created_at: '2024-01-01',
          person_profile: {
            major_or_interest: 'CS',
            graduation_year: 2025,
            linkedin_url: null,
            skills: ['React'],
            is_recruiter_visible: false,
            updated_at: '2024-01-01',
            chapter_membership: {
              chapter_id: 'ch-1',
              chapter: { name: 'MIT', university: 'MIT', city: 'Cambridge', region: 'MA' },
            },
          },
        },
        error: null,
      })

      const result = await CompanyService.getStudentById(mockSupabase as unknown as SupabaseClient, 'student-1')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: null,
        error: { message: 'DB error' },
      })

      const result = await CompanyService.getStudentById(mockSupabase as unknown as SupabaseClient, 'student-1')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // toggleSaveStudent
  // ───────────────────────────────────────────────────────────────
  describe('toggleSaveStudent', () => {
    it('should save a student when not already saved', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      // getStudentById returns a valid student
      tableMocks.user._builder._setThenValue({
        data: {
          id: 'student-1',
          email: 'student@test.com',
          name: 'Student',
          phone: null,
          created_at: '2024-01-01',
          person_profile: {
            major_or_interest: 'CS',
            graduation_year: 2025,
            linkedin_url: null,
            skills: ['React'],
            is_recruiter_visible: true,
            updated_at: '2024-01-01',
            chapter_membership: {
              chapter_id: 'ch-1',
              chapter: { name: 'MIT', university: 'MIT', city: 'Cambridge', region: 'MA' },
            },
          },
        },
        error: null,
      })

      // saved_student check returns null (not saved)
      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: null,
      })

      // saved_student insert succeeds
      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await CompanyService.toggleSaveStudent(mockSupabase as unknown as SupabaseClient, 'recruiter-1', 'student-1')

      expect(result.success).toBe(true)
      expect(result.isSaved).toBe(true)
    })

    it('should unsave a student when already saved', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      // getStudentById returns a valid student
      tableMocks.user._builder._setThenValue({
        data: {
          id: 'student-1',
          email: 'student@test.com',
          name: 'Student',
          phone: null,
          created_at: '2024-01-01',
          person_profile: {
            major_or_interest: 'CS',
            graduation_year: 2025,
            linkedin_url: null,
            skills: ['React'],
            is_recruiter_visible: true,
            updated_at: '2024-01-01',
            chapter_membership: {
              chapter_id: 'ch-1',
              chapter: { name: 'MIT', university: 'MIT', city: 'Cambridge', region: 'MA' },
            },
          },
        },
        error: null,
      })

      // saved_student check returns existing record
      tableMocks.saved_student._builder._setThenValue({
        data: { id: 'saved-1' },
        error: null,
      })

      // saved_student delete succeeds
      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await CompanyService.toggleSaveStudent(mockSupabase as unknown as SupabaseClient, 'recruiter-1', 'student-1')

      expect(result.success).toBe(true)
      expect(result.isSaved).toBe(false)
    })

    it('should return error for non-visible student', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      // getStudentById returns null (invisible)
      tableMocks.user._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await CompanyService.toggleSaveStudent(mockSupabase as unknown as SupabaseClient, 'recruiter-1', 'student-1')

      expect(result.success).toBe(false)
      expect(result.isSaved).toBe(false)
      expect(result.error).toBe('Student is not available to recruiters.')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // isStudentSaved
  // ───────────────────────────────────────────────────────────────
  describe('isStudentSaved', () => {
    it('should return true when student is saved', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.saved_student._builder._setThenValue({
        data: { id: 'saved-1' },
        error: null,
      })

      const result = await CompanyService.isStudentSaved(mockSupabase as unknown as SupabaseClient, 'recruiter-1', 'student-1')

      expect(result).toBe(true)
    })

    it('should return false when student is not saved', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await CompanyService.isStudentSaved(mockSupabase as unknown as SupabaseClient, 'recruiter-1', 'student-1')

      expect(result).toBe(false)
    })
  })

  // ───────────────────────────────────────────────────────────────
  // updateProfile
  // ───────────────────────────────────────────────────────────────
  describe('updateProfile', () => {
    it('should update name and phone', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: null, error: null })

      const result = await CompanyService.updateProfile(mockSupabase as unknown as SupabaseClient, 'user-1', {
        name: 'New Name',
        phone: '+1234567890',
      })

      expect(result.success).toBe(true)
      expect(tableMocks.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          phone: '+1234567890',
        })
      )
    })

    it('should return error on update failure', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: null, error: { message: 'DB error' } })

      const result = await CompanyService.updateProfile(mockSupabase as unknown as SupabaseClient, 'user-1', {
        name: 'New Name',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update profile information')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getRecruiterProfile
  // ───────────────────────────────────────────────────────────────
  describe('getRecruiterProfile', () => {
    it('should return recruiter profile with company', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: {
          id: 'access-1',
          company_id: 'comp-1',
          is_active: true,
          accepted_at: '2024-01-01',
          company: [
            { id: 'comp-1', name: 'Acme Inc', created_at: '2024-01-01', created_by_id: 'user-1' },
          ],
        },
        error: null,
      })

      const result = await CompanyService.getRecruiterProfile(mockSupabase as unknown as SupabaseClient, 'user-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.company?.name).toBe('Acme Inc')
      }
      expect(mockSupabase.from).not.toHaveBeenCalledWith('person_profile')
      expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
    })

    it('should return error when access fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: null,
        error: { message: 'DB error' },
      })

      const result = await CompanyService.getRecruiterProfile(mockSupabase as unknown as SupabaseClient, 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to load recruiter access.')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getRecruiterCompanies
  // ───────────────────────────────────────────────────────────────
  describe('getRecruiterCompanies', () => {
    it('should return all companies for recruiter', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: [
          {
            id: 'access-1',
            company_id: 'comp-1',
            is_active: true,
            accepted_at: '2024-01-01',
            granted_at: '2024-01-01',
            revoked_at: null,
            company: [
              { id: 'comp-1', name: 'Acme Inc', created_at: '2024-01-01', created_by_id: 'user-1' },
            ],
          },
        ],
        error: null,
      })

      const result = await CompanyService.getRecruiterCompanies(mockSupabase as unknown as SupabaseClient, 'user-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.allCompanies).toHaveLength(1)
        expect(result.data.allCompanies[0].companyName).toBe('Acme Inc')
      }
    })
  })
})
