import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RecruiterService } from '../recruiter.service'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Build a thenable Supabase query builder mock.
 * All chain methods return the builder (this) for fluent chaining,
 * and the builder itself is thenable so `await query` resolves the final data.
 */
interface MockBuilder {
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  contains: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
  _setThenValue: (value: unknown) => void
}

interface TableMock {
  select?: ReturnType<typeof vi.fn>
  _builder?: MockBuilder
}

const buildMockSupabase = (overrides: Record<string, unknown> = {}) => {
  let builderThenValue: unknown = { data: [], error: null }

  const builder: MockBuilder = {
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    or: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    contains: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(builderThenValue)),
    single: vi.fn(() => Promise.resolve(builderThenValue)),
    then: vi.fn((resolve: (value: unknown) => unknown) => resolve(builderThenValue)),
    _setThenValue: (value: unknown) => {
      builderThenValue = value
    },
  }

  const tableMocks: Record<string, TableMock> = {
    user: {
      select: vi.fn(() => builder),
      _builder: builder,
    },
    saved_student: {
      select: vi.fn(() => builder),
      _builder: builder,
    },
    person_profile: {
      select: vi.fn(() => builder),
      _builder: builder,
    },
    ...overrides,
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks, builder }
}

describe('RecruiterService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTalentPool', () => {
    it('should return students with pagination', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: [
          {
            id: 'user-1',
            name: 'John',
            email: 'john@test.com',
            person_profile: {
              graduation_year: 2025,
              major_or_interest: 'CS',
              skills: ['React'],
              updated_at: '2024-01-01',
              chapter_membership: {
                chapter: { name: 'MIT', university: 'MIT' },
              },
            },
          },
        ],
        error: null,
        count: 1,
      })

      const result = await RecruiterService.getTalentPool(mockSupabase as unknown as SupabaseClient, {})

      expect(result.students).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(result.hasNextPage).toBe(false)
    })

    it('should apply filters', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: [],
        error: null,
        count: 0,
      })

      await RecruiterService.getTalentPool(mockSupabase as unknown as SupabaseClient, {
        query: 'john',
        graduation_year: 2025,
        chapter_id: 'ch-1',
        skills: ['React'],
      })

      expect(tableMocks.user._builder.ilike).toHaveBeenCalledWith('name', '%john%')
      expect(tableMocks.user._builder.eq).toHaveBeenCalledWith('person_profile.graduation_year', 2025)
      expect(tableMocks.user._builder.eq).toHaveBeenCalledWith('person_profile.chapter_membership.chapter_id', 'ch-1')
      expect(tableMocks.user._builder.contains).toHaveBeenCalledWith('person_profile.skills', ['React'])
    })

    it('should handle errors gracefully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: null,
        error: { message: 'DB error' },
        count: null,
      })

      const result = await RecruiterService.getTalentPool(mockSupabase as unknown as SupabaseClient, {})

      expect(result.students).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('getSavedStudents', () => {
    it('should return saved students for recruiter', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.saved_student._builder._setThenValue({
        data: [
          {
            student_id: 'user-1',
            student: {
              id: 'user-1',
              name: 'John',
              email: 'john@test.com',
              person_profile: {
                graduation_year: 2025,
                major_or_interest: 'CS',
                skills: ['React'],
                updated_at: '2024-01-01',
                chapter_membership: {
                  chapter: { name: 'MIT', university: 'MIT' },
                },
              },
            },
          },
        ],
        error: null,
        count: 1,
      })

      const result = await RecruiterService.getSavedStudents(mockSupabase as unknown as SupabaseClient, 'recruiter-1', {})

      expect(result.students).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe('getTalentPoolFilterOptions', () => {
    it('should return years and chapters', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile._builder._setThenValue({
        data: [
          { graduation_year: 2024, chapter_membership: { chapter: { id: 'ch-1', name: 'MIT' } } },
          { graduation_year: 2025, chapter_membership: { chapter: { id: 'ch-2', name: 'Stanford' } } },
          { graduation_year: 2024, chapter_membership: { chapter: { id: 'ch-1', name: 'MIT' } } },
        ],
        error: null,
      })

      const result = await RecruiterService.getTalentPoolFilterOptions(mockSupabase as unknown as SupabaseClient)

      expect(result.years).toEqual([2024, 2025])
      expect(result.chapters).toHaveLength(2)
      expect(result.chapters[0].name).toBe('MIT')
      expect(result.chapters[1].name).toBe('Stanford')
    })

    it('should handle errors gracefully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.person_profile._builder._setThenValue({
        data: null,
        error: { message: 'DB error' },
      })

      const result = await RecruiterService.getTalentPoolFilterOptions(mockSupabase as unknown as SupabaseClient)

      expect(result.years).toEqual([])
      expect(result.chapters).toEqual([])
    })
  })

  describe('getSavedStatus', () => {
    it('should return saved student IDs', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.saved_student._builder._setThenValue({
        data: [{ student_id: 'user-1' }, { student_id: 'user-2' }],
        error: null,
      })

      const result = await RecruiterService.getSavedStatus(mockSupabase as unknown as SupabaseClient, 'recruiter-1', ['user-1', 'user-2', 'user-3'])

      expect(result).toEqual(['user-1', 'user-2'])
    })

    it('should return empty array for empty studentIds', async () => {
      const { mockSupabase } = buildMockSupabase()

      const result = await RecruiterService.getSavedStatus(mockSupabase as unknown as SupabaseClient, 'recruiter-1', [])

      expect(result).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.saved_student._builder._setThenValue({
        data: null,
        error: { message: 'DB error' },
      })

      const result = await RecruiterService.getSavedStatus(mockSupabase as unknown as SupabaseClient, 'recruiter-1', ['user-1'])

      expect(result).toEqual([])
    })
  })
})
