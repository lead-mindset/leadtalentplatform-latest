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
  const chapterMembershipBuilder = createBuilder()
  const chapterBuilder = createBuilder()
  const savedStudentBuilder = createBuilder()
  const recruiterAccessBuilder = createBuilder()
  const resumeBuilder = createBuilder()
  const resumeDownloadLogBuilder = createBuilder()
  const storageBucket = {
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-resume.pdf' },
      error: null,
    }),
  }

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
    chapter_membership: {
      select: vi.fn(() => chapterMembershipBuilder),
      _builder: chapterMembershipBuilder,
    },
    chapter: {
      select: vi.fn(() => chapterBuilder),
      _builder: chapterBuilder,
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
    resume: {
      select: vi.fn(() => resumeBuilder),
      _builder: resumeBuilder,
    },
    resume_download_log: {
      insert: vi.fn(() => resumeDownloadLogBuilder),
      _builder: resumeDownloadLogBuilder,
    },
    ...overrides,
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
    storage: {
      from: vi.fn(() => storageBucket),
    },
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

function queueVisibleStudent(
  tableMocks: Record<string, { _builder: { _setThenValue: (value: unknown) => void } }>,
  overrides: {
    userId?: string
    name?: string
    email?: string
    visible?: boolean
    approved?: boolean
  } = {}
) {
  const userId = overrides.userId ?? 'student-1'
  const visible = overrides.visible ?? true
  const approved = overrides.approved ?? true

  tableMocks.person_profile._builder._setThenValue({
    data: visible
      ? [
          {
            user_id: userId,
            major_or_interest: 'CS',
            graduation_year: 2025,
            linkedin_url: null,
            portfolio_url: 'https://portfolio.example.com/student',
            skills: ['React'],
            is_recruiter_visible: true,
            updated_at: '2024-01-01',
          },
        ]
      : [],
    error: null,
  })

  tableMocks.chapter_membership._builder._setThenValue({
    data: approved
      ? [
          {
            user_id: userId,
            chapter_id: 'ch-1',
            status: 'approved',
          },
        ]
      : [],
    error: null,
  })

  tableMocks.user._builder._setThenValue({
    data: [
      {
        id: userId,
        email: overrides.email ?? 'student@test.com',
        name: overrides.name ?? 'Student',
        phone: null,
        created_at: '2024-01-01',
      },
    ],
    error: null,
  })

  tableMocks.chapter._builder._setThenValue({
    data: [
      {
        id: 'ch-1',
        name: 'MIT',
        university: 'MIT',
        city: 'Cambridge',
        region: 'MA',
      },
    ],
    error: null,
  })
}

describe('CompanyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not expose legacy company invite activation', () => {
    const serviceMethods = CompanyService as Record<string, unknown>

    expect(serviceMethods.acceptInvite).toBeUndefined()
  })

  // ───────────────────────────────────────────────────────────────
  // getStudentById
  // ───────────────────────────────────────────────────────────────
  describe('getStudentById', () => {
    it('should return a visible student', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      queueVisibleStudent(tableMocks)

      const result = await CompanyService.getStudentById(mockSupabase as unknown as SupabaseClient, 'student-1')

      expect(result).not.toBeNull()
      expect(result?.name).toBe('Student')
      expect(result?.person_profile?.is_recruiter_visible).toBe(true)
      expect(result?.person_profile?.portfolio_url).toBe('https://portfolio.example.com/student')
      expect(tableMocks.person_profile._builder.eq).toHaveBeenCalledWith('is_recruiter_visible', true)
      expect(tableMocks.chapter_membership._builder.eq).toHaveBeenCalledWith('status', 'approved')
    })

    it('should return null for invisible student', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      queueVisibleStudent(tableMocks, { visible: false })

      const result = await CompanyService.getStudentById(mockSupabase as unknown as SupabaseClient, 'student-1')

      expect(result).toBeNull()
    })

    it('should return null for non-approved membership even if profile is recruiter visible', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      queueVisibleStudent(tableMocks, { approved: false })

      const result = await CompanyService.getStudentById(mockSupabase as unknown as SupabaseClient, 'student-1')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile._builder._setThenValue({
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

      // saved_student check returns null (not saved)
      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: null,
      })

      // getStudentById returns a valid student
      queueVisibleStudent(tableMocks)

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

      // saved_student check returns null (not saved)
      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: null,
      })

      // getStudentById returns null (invisible)
      queueVisibleStudent(tableMocks, { visible: false })

      const result = await CompanyService.toggleSaveStudent(mockSupabase as unknown as SupabaseClient, 'recruiter-1', 'student-1')

      expect(result.success).toBe(false)
      expect(result.isSaved).toBe(false)
      expect(result.error).toBe('Profile not found or unavailable.')
    })

    it('should allow unsaving an owned saved row even when current visibility is unavailable', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.saved_student._builder._setThenValue({
        data: { id: 'saved-1' },
        error: null,
      })

      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await CompanyService.toggleSaveStudent(mockSupabase as unknown as SupabaseClient, 'recruiter-1', 'student-1')

      expect(result.success).toBe(true)
      expect(result.isSaved).toBe(false)
      expect(tableMocks.user.select).not.toHaveBeenCalled()
    })
  })

  describe('searchStudents', () => {
    it('should use visibility and approved membership filters without app-role eligibility', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile._builder._setThenValue({
        data: [],
        error: null,
      })

      await CompanyService.searchStudents(mockSupabase as unknown as SupabaseClient, {})

      expect(tableMocks.person_profile._builder.eq).toHaveBeenCalledWith('is_recruiter_visible', true)
      expect(tableMocks.chapter_membership._builder.eq).not.toHaveBeenCalled()
      expect(tableMocks.user._builder.eq).not.toHaveBeenCalledWith('role', 'member')
      expect(tableMocks.user._builder.in).not.toHaveBeenCalled()
    })
  })

  describe('getSavedStudents', () => {
    it('should only return saved profiles that still pass current visibility rules', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.saved_student._builder._setThenValue({
        data: [
          {
            id: 'saved-1',
            recruiter_id: 'recruiter-1',
            student_id: 'student-1',
            saved_at: '2024-01-01',
            notes: null,
            student: {
              id: 'student-1',
              email: 'student@test.com',
              name: 'Student',
              phone: null,
              created_at: '2024-01-01',
              person_profile: {
                major_or_interest: 'CS',
                graduation_year: 2025,
                linkedin_url: null,
                portfolio_url: 'https://portfolio.example.com/student',
                skills: ['React'],
                is_recruiter_visible: true,
                updated_at: '2024-01-01',
                chapter_membership: {
                  chapter_id: 'ch-1',
                  status: 'approved',
                  chapter: { name: 'MIT', university: 'MIT', city: 'Cambridge', region: 'MA' },
                },
              },
            },
          },
          {
            id: 'saved-2',
            recruiter_id: 'recruiter-1',
            student_id: 'student-2',
            saved_at: '2024-01-02',
            notes: null,
            student: {
              id: 'student-2',
              email: 'hidden@test.com',
              name: 'Hidden',
              phone: null,
              created_at: '2024-01-01',
              person_profile: {
                major_or_interest: 'CS',
                graduation_year: 2025,
                linkedin_url: null,
                portfolio_url: 'https://portfolio.example.com/hidden',
                skills: ['React'],
                is_recruiter_visible: false,
                updated_at: '2024-01-01',
                chapter_membership: {
                  chapter_id: 'ch-1',
                  status: 'approved',
                  chapter: { name: 'MIT', university: 'MIT', city: 'Cambridge', region: 'MA' },
                },
              },
            },
          },
        ],
        error: null,
      })
      queueVisibleStudent(tableMocks)

      const result = await CompanyService.getSavedStudents(mockSupabase as unknown as SupabaseClient, 'recruiter-1')

      expect(result).toHaveLength(1)
      expect(result[0].student_id).toBe('student-1')
      expect(tableMocks.person_profile._builder.eq).toHaveBeenCalledWith('is_recruiter_visible', true)
      expect(tableMocks.chapter_membership._builder.eq).toHaveBeenCalledWith('status', 'approved')
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
  describe('createResumeDownloadUrl', () => {
    it('should deny resume download before storage access when candidate is unavailable', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await CompanyService.createResumeDownloadUrl(
        mockSupabase as unknown as SupabaseClient,
        'recruiter-1',
        'student-1'
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Profile not found or unavailable.')
      }
      expect(mockSupabase.storage.from).not.toHaveBeenCalled()
      expect(tableMocks.resume_download_log.insert).not.toHaveBeenCalled()
    })

    it('should create a signed resume URL and log only after current visibility passes', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      queueVisibleStudent(tableMocks)

      tableMocks.resume._builder._setThenValue({
        data: {
          file_url: 'https://example.supabase.co/storage/v1/object/public/resumes/student-1/resume.pdf',
        },
        error: null,
      })

      tableMocks.resume_download_log._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await CompanyService.createResumeDownloadUrl(
        mockSupabase as unknown as SupabaseClient,
        'recruiter-1',
        'student-1'
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.url).toBe('https://example.com/signed-resume.pdf')
      }
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('resumes')
      expect(tableMocks.resume_download_log.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          recruiter_id: 'recruiter-1',
          student_id: 'student-1',
        })
      )
    })
  })

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
