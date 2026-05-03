import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminService } from '../admin.service'
import { SupabaseClient } from '@supabase/supabase-js'

// ───────────────────────────────────────────────────────────────
// Helper: Build a thenable Supabase query builder mock
// ───────────────────────────────────────────────────────────────
const buildMockSupabase = (overrides: Record<string, unknown> = {}) => {
  const createBuilder = () => {
    let defaultValue: unknown = { data: [], error: null }
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
      contains: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      order: vi.fn(() => builder),
      range: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lt: vi.fn(() => builder),
      gt: vi.fn(() => builder),
      is: vi.fn(() => builder),
      not: vi.fn(() => builder),
      select: vi.fn(() => builder),
      update: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      delete: vi.fn(() => builder),
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
  const chapterBuilder = createBuilder()
  const eventBuilder = createBuilder()
  const companyBuilder = createBuilder()
  const recruiterAccessBuilder = createBuilder()
  const chapterMembershipBuilder = createBuilder()

  const tableMocks: Record<string, unknown> = {
    user: {
      select: vi.fn(() => userBuilder),
      update: vi.fn(() => userBuilder),
      insert: vi.fn(() => userBuilder),
      delete: vi.fn(() => userBuilder),
      _builder: userBuilder,
    },
    person_profile: {
      select: vi.fn(() => studentProfileBuilder),
      update: vi.fn(() => studentProfileBuilder),
      _builder: studentProfileBuilder,
    },
    chapter_membership: {
      select: vi.fn(() => chapterMembershipBuilder),
      update: vi.fn(() => chapterMembershipBuilder),
      insert: vi.fn(() => chapterMembershipBuilder),
      delete: vi.fn(() => chapterMembershipBuilder),
      _builder: chapterMembershipBuilder,
    },
    chapter: {
      select: vi.fn(() => chapterBuilder),
      _builder: chapterBuilder,
    },
    event: {
      select: vi.fn(() => eventBuilder),
      _builder: eventBuilder,
    },
    company: {
      select: vi.fn(() => companyBuilder),
      _builder: companyBuilder,
    },
    recruiter_access: {
      select: vi.fn(() => recruiterAccessBuilder),
      update: vi.fn(() => recruiterAccessBuilder),
      insert: vi.fn(() => recruiterAccessBuilder),
      delete: vi.fn(() => recruiterAccessBuilder),
      _builder: recruiterAccessBuilder,
    },
    ...overrides,
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ───────────────────────────────────────────────────────────────
  // getAdminDashboardStats
  // ───────────────────────────────────────────────────────────────
  describe('getAdminDashboardStats', () => {
    it('should return aggregated stats', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      // Mock user count
      tableMocks.user._builder._setThenValue({ data: [], error: null, count: 100 })
      // Mock chapter_membership chapter query
      tableMocks.chapter_membership._builder._setThenValue({
        data: [{ chapter_id: 'ch-1' }, { chapter_id: 'ch-2' }, { chapter_id: 'ch-1' }],
        error: null,
      })
      // Mock event count
      tableMocks.event._builder._setThenValue({ data: [], error: null, count: 5 })
      // Mock approved profiles count
      tableMocks.chapter_membership._builder._setThenValue({ data: [], error: null, count: 80 })
      // Mock visible approved profiles count
      tableMocks.person_profile._builder._setThenValue({ data: [], error: null, count: 60 })

      const result = await AdminService.getAdminDashboardStats(mockSupabase as unknown as SupabaseClient)

      expect(result.total_students).toBe(100)
      expect(result.active_chapters).toBe(2)
      expect(result.events_this_month).toBe(5)
      expect(result.recruiter_opt_in_rate).toBe(75) // 60/80 = 75%
    })

    it('should handle zero approved profiles gracefully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: [], error: null, count: 0 })
      tableMocks.chapter_membership._builder._setThenValue({ data: [], error: null })
      tableMocks.event._builder._setThenValue({ data: [], error: null, count: 0 })
      tableMocks.person_profile._builder._setThenValue({ data: [], error: null, count: 0 })
      tableMocks.person_profile._builder._setThenValue({ data: [], error: null, count: 0 })

      const result = await AdminService.getAdminDashboardStats(mockSupabase as unknown as SupabaseClient)

      expect(result.recruiter_opt_in_rate).toBe(0)
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getUsersList
  // ───────────────────────────────────────────────────────────────
  describe('getUsersList', () => {
    it('should return paginated user list with profiles', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: [
          { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'member', created_at: '2024-01-01', deactivated_at: null },
          { id: 'user-2', name: 'Bob', email: 'bob@test.com', role: 'editor', created_at: '2024-01-02', deactivated_at: null },
        ],
        error: null,
      })

      tableMocks.person_profile._builder._setThenValue({
        data: [
          { user_id: 'user-1' },
        ],
        error: null,
      })
      tableMocks.chapter_membership._builder._setThenValue({
        data: [
          { user_id: 'user-1', chapter_id: 'ch-1', status: 'approved', chapter: { name: 'MIT' } },
        ],
        error: null,
      })

      const result = await AdminService.getUsersList(mockSupabase as unknown as SupabaseClient, {}, { page: 1, pageSize: 25 })

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      // Default sort is created_at desc, so Bob (2024-01-02) comes before Alice (2024-01-01)
      expect(result.items[0].profile_status).toBe('no_profile')
      expect(result.items[1].profile_status).toBe('complete')
    })

    it('should filter by search query', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: [
          { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'member', created_at: '2024-01-01', deactivated_at: null },
        ],
        error: null,
      })

      tableMocks.person_profile._builder._setThenValue({
        data: [],
        error: null,
      })

      const result = await AdminService.getUsersList(
        mockSupabase as unknown as SupabaseClient,
        { search: 'alice' },
        { page: 1, pageSize: 25 }
      )

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Alice')
    })

    it('should sort by name ascending', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: [
          { id: 'user-2', name: 'Bob', email: 'bob@test.com', role: 'member', created_at: '2024-01-02', deactivated_at: null },
          { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'member', created_at: '2024-01-01', deactivated_at: null },
        ],
        error: null,
      })

      tableMocks.person_profile._builder._setThenValue({
        data: [],
        error: null,
      })

      const result = await AdminService.getUsersList(
        mockSupabase as unknown as SupabaseClient,
        {},
        { page: 1, pageSize: 25, sortBy: 'name', sortOrder: 'asc' }
      )

      expect(result.items[0].name).toBe('Alice')
      expect(result.items[1].name).toBe('Bob')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // updateUserRole
  // ───────────────────────────────────────────────────────────────
  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: null, error: null })

      const result = await AdminService.updateUserRole(mockSupabase as unknown as SupabaseClient, 'user-1', 'editor')

      expect(result.success).toBe(true)
      expect(tableMocks.user.update).toHaveBeenCalledWith({ role: 'editor' })
    })

    it('should return error on update failure', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: null, error: { message: 'DB error' } })

      const result = await AdminService.updateUserRole(mockSupabase as unknown as SupabaseClient, 'user-1', 'editor')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update user role.')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // deactivateUser / reactivateUser
  // ───────────────────────────────────────────────────────────────
  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: null, error: null })

      const result = await AdminService.deactivateUser(mockSupabase as unknown as SupabaseClient, 'user-1')

      expect(result.success).toBe(true)
    })
  })

  describe('reactivateUser', () => {
    it('should reactivate user', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: null, error: null })

      const result = await AdminService.reactivateUser(mockSupabase as unknown as SupabaseClient, 'user-1')

      expect(result.success).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getAdminEventsList
  // ───────────────────────────────────────────────────────────────
  describe('getAdminEventsList', () => {
    it('should return paginated events with status', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const futureDate = new Date(Date.now() + 86400000).toISOString()
      const pastDate = new Date(Date.now() - 86400000).toISOString()

      tableMocks.event._builder._setThenValue({
        data: [
          {
            id: 'evt-1',
            title: 'Future Event',
            start_at: futureDate,
            end_at: futureDate,
            is_published: true,
            chapter_id: 'ch-1',
            capacity: 100,
            chapter: { name: 'MIT' },
            event_chapter: [],
            event_registration: [{ status: 'registered' }, { status: 'registered' }],
          },
          {
            id: 'evt-2',
            title: 'Past Event',
            start_at: pastDate,
            end_at: pastDate,
            is_published: true,
            chapter_id: 'ch-1',
            capacity: 50,
            chapter: { name: 'MIT' },
            event_chapter: [],
            event_registration: [{ status: 'registered' }],
          },
        ],
        error: null,
      })

      const result = await AdminService.getAdminEventsList(
        mockSupabase as unknown as SupabaseClient,
        {},
        { page: 1, pageSize: 25 }
      )

      expect(result.items).toHaveLength(2)
      expect(result.items[0].registrations).toBe(2)
      expect(result.items[1].registrations).toBe(1)
    })

    it('should filter by status', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      const futureDate = new Date(Date.now() + 86400000).toISOString()

      tableMocks.event._builder._setThenValue({
        data: [
          {
            id: 'evt-1',
            title: 'Upcoming',
            start_at: futureDate,
            end_at: futureDate,
            is_published: true,
            chapter_id: 'ch-1',
            capacity: 100,
            chapter: { name: 'MIT' },
            event_chapter: [],
            event_registration: [],
          },
          {
            id: 'evt-2',
            title: 'Draft',
            start_at: futureDate,
            end_at: futureDate,
            is_published: false,
            chapter_id: 'ch-1',
            capacity: 100,
            chapter: { name: 'MIT' },
            event_chapter: [],
            event_registration: [],
          },
        ],
        error: null,
      })

      const result = await AdminService.getAdminEventsList(
        mockSupabase as unknown as SupabaseClient,
        { statuses: ['upcoming'] },
        { page: 1, pageSize: 25 }
      )

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('Upcoming')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // bulkUpdateUsers
  // ───────────────────────────────────────────────────────────────
  describe('bulkUpdateUsers', () => {
    it('should update multiple users roles', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({ data: null, error: null })

      const result = await AdminService.bulkUpdateUsers(
        mockSupabase as unknown as SupabaseClient,
        ['user-1', 'user-2'],
        { type: 'change_role', role: 'editor' as unknown as SupabaseClient }
      )

      expect(result.success).toBe(true)
    })

    it('should return error for empty user list', async () => {
      const { mockSupabase } = buildMockSupabase()

      const result = await AdminService.bulkUpdateUsers(
        mockSupabase as unknown as SupabaseClient,
        [],
        { type: 'deactivate' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No users selected.')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // exportUsersCSV
  // ───────────────────────────────────────────────────────────────
  describe('exportUsersCSV', () => {
    it('should generate CSV from user list', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.user._builder._setThenValue({
        data: [
          { id: 'user-1', name: 'Alice', email: 'alice@test.com', role: 'member', created_at: '2024-01-01', deactivated_at: null },
        ],
        error: null,
      })

      tableMocks.person_profile._builder._setThenValue({
        data: [],
        error: null,
      })

      const result = await AdminService.exportUsersCSV(mockSupabase as unknown as SupabaseClient, {})

      expect(result).toContain('Name,Email,Role,Chapter,Join Date,Profile Status,Deactivated At')
      expect(result).toContain('Alice')
      expect(result).toContain('alice@test.com')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getChaptersList
  // ───────────────────────────────────────────────────────────────
  describe('getChaptersList', () => {
    it('should return filtered sorted chapters', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.chapter._builder._setThenValue({
        data: [
          { id: 'ch-1', name: 'Alpha Chapter', university: 'Uni A', city: 'City A', region: 'Region A', created_at: '2024-01-01' },
          { id: 'ch-2', name: 'Beta Chapter', university: 'Uni B', city: 'City B', region: 'Region B', created_at: '2024-02-01' },
        ],
        error: null,
      })
      tableMocks.chapter._builder._setThenValue({ data: [], error: null, count: 2 })

      const result = await AdminService.getChaptersList(mockSupabase as unknown as SupabaseClient, {}, { page: 1, pageSize: 10 })

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.items[0].name).toBe('Alpha Chapter')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getCompaniesList
  // ───────────────────────────────────────────────────────────────
  describe('getCompaniesList', () => {
    it('should return paginated companies', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.company._builder._setThenValue({
        data: [{ id: 'co-1', name: 'Company A', created_at: '2024-01-01', created_by_id: 'user-1' }],
        error: null,
      })
      tableMocks.recruiter_access._builder._setThenValue({
        data: [],
        error: null,
      })

      const result = await AdminService.getCompaniesList(mockSupabase as unknown as SupabaseClient, {}, { page: 1, pageSize: 10 })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getCompanyById
  // ───────────────────────────────────────────────────────────────
  describe('getCompanyById', () => {
    it('should return company with recruiters', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.company._builder._setThenValue({
        data: { id: 'co-1', name: 'Company A', created_at: '2024-01-01', created_by_id: 'user-1' },
        error: null,
      })
      tableMocks.recruiter_access._builder._setThenValue({
        data: [],
        error: null,
      })

      const result = await AdminService.getCompanyById(mockSupabase as unknown as SupabaseClient, 'co-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('co-1')
      expect(result?.name).toBe('Company A')
    })

    it('should return null on error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.company._builder._setThenValue({
        data: null,
        error: { message: 'DB error' },
      })

      const result = await AdminService.getCompanyById(mockSupabase as unknown as SupabaseClient, 'co-missing')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // createRecruiterInvite
  // ───────────────────────────────────────────────────────────────
  describe('createRecruiterInvite', () => {
    it('should create a recruiter invite', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('token-123')

      tableMocks.recruiter_access._builder.then.mockImplementationOnce((resolve: (value: unknown) => unknown) =>
        resolve({ data: [], error: null })
      )
      tableMocks.recruiter_access._builder.single.mockResolvedValueOnce({
        data: { id: 'ra-1', recruiter_email: 'rec@test.com', company_id: 'co-1', invite_token: 'token-123', invite_expires_at: null },
        error: null,
      })

      const result = await AdminService.createRecruiterInvite(mockSupabase as unknown as SupabaseClient, 'admin-1', {
        recruiterEmail: 'rec@test.com',
        companyId: 'co-1',
        expiresInDays: 7,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.inviteId).toBe('ra-1')
        expect(result.token).toBe('token-123')
      }

      randomUUIDSpy.mockRestore()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // regenerateInviteToken
  // ───────────────────────────────────────────────────────────────
  describe('regenerateInviteToken', () => {
    it('should regenerate token successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()
      const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('new-token')

      tableMocks.recruiter_access._builder._setThenValue({
        data: { id: 'ra-1', recruiter_email: 'rec@test.com', company_id: 'co-1', invite_token: 'old-token', invite_expires_at: null },
        error: null,
      })
      tableMocks.recruiter_access._builder._setThenValue({
        data: { id: 'ra-1', recruiter_email: 'rec@test.com', company_id: 'co-1', invite_token: 'new-token', invite_expires_at: null },
        error: null,
      })

      const result = await AdminService.regenerateInviteToken(mockSupabase as unknown as SupabaseClient, 'ra-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.token).toBe('new-token')
      }

      randomUUIDSpy.mockRestore()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // revokeInvite
  // ───────────────────────────────────────────────────────────────
  describe('revokeInvite', () => {
    it('should revoke an invite successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: { id: 'ra-1', recruiter_email: 'rec@test.com', company_id: 'co-1', accepted_at: null, invite_expires_at: null, revoked_at: null },
        error: null,
      })
      tableMocks.recruiter_access._builder._setThenValue({
        data: { id: 'ra-1', revoked_at: new Date().toISOString() },
        error: null,
      })

      const result = await AdminService.revokeInvite(mockSupabase as unknown as SupabaseClient, 'admin-1', 'ra-1')

      expect(result.success).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────
  // validateCompanyExists
  // ───────────────────────────────────────────────────────────────
  describe('validateCompanyExists', () => {
    it('should return company when found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.company._builder._setThenValue({
        data: { id: 'co-1', name: 'Company A' },
        error: null,
      })

      const result = await AdminService.validateCompanyExists(mockSupabase as unknown as SupabaseClient, 'co-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('co-1')
      expect(result?.name).toBe('Company A')
    })

    it('should return null when not found', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.company._builder._setThenValue({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await AdminService.validateCompanyExists(mockSupabase as unknown as SupabaseClient, 'co-missing')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // checkExistingRecruiterInvite
  // ───────────────────────────────────────────────────────────────
  describe('checkExistingRecruiterInvite', () => {
    it('should return existing invite', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: { id: 'ra-1', accepted_at: null, revoked_at: null },
        error: null,
      })

      const result = await AdminService.checkExistingRecruiterInvite(mockSupabase as unknown as SupabaseClient, 'rec@test.com', 'co-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('ra-1')
    })

    it('should return null when no invite exists', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: null,
        error: null,
      })

      const result = await AdminService.checkExistingRecruiterInvite(mockSupabase as unknown as SupabaseClient, 'new@test.com', 'co-1')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getInviteForResend
  // ───────────────────────────────────────────────────────────────
  describe('getInviteForResend', () => {
    it('should return invite with company name when company is an array', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: {
          id: 'ra-1',
          recruiter_email: 'rec@test.com',
          company_id: 'co-1',
          revoked_at: null,
          accepted_at: null,
          company: [{ name: 'Company A' }],
        },
        error: null,
      })

      const result = await AdminService.getInviteForResend(mockSupabase as unknown as SupabaseClient, 'ra-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('ra-1')
      expect(result?.recruiter_email).toBe('rec@test.com')
      expect(result?.company?.name).toBe('Company A')
    })

    it('should return invite with company name when company is an object', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: {
          id: 'ra-2',
          recruiter_email: 'rec2@test.com',
          company_id: 'co-2',
          revoked_at: '2024-01-01T00:00:00Z',
          accepted_at: '2024-01-02T00:00:00Z',
          company: { name: 'Company B' },
        },
        error: null,
      })

      const result = await AdminService.getInviteForResend(mockSupabase as unknown as SupabaseClient, 'ra-2')

      expect(result).not.toBeNull()
      expect(result?.revoked_at).toBe('2024-01-01T00:00:00Z')
      expect(result?.accepted_at).toBe('2024-01-02T00:00:00Z')
      expect(result?.company?.name).toBe('Company B')
    })

    it('should return null on error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await AdminService.getInviteForResend(mockSupabase as unknown as SupabaseClient, 'ra-missing')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getInviteForRevoke
  // ───────────────────────────────────────────────────────────────
  describe('getInviteForRevoke', () => {
    it('should return invite details', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: {
          id: 'ra-1',
          recruiter_email: 'rec@test.com',
          company_id: 'co-1',
          revoked_at: null,
        },
        error: null,
      })

      const result = await AdminService.getInviteForRevoke(mockSupabase as unknown as SupabaseClient, 'ra-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('ra-1')
      expect(result?.recruiter_email).toBe('rec@test.com')
      expect(result?.company_id).toBe('co-1')
      expect(result?.revoked_at).toBeNull()
    })

    it('should return null on error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await AdminService.getInviteForRevoke(mockSupabase as unknown as SupabaseClient, 'ra-missing')

      expect(result).toBeNull()
    })
  })

  // ───────────────────────────────────────────────────────────────
  // deleteInvite
  // ───────────────────────────────────────────────────────────────
  describe('deleteInvite', () => {
    it('should delete invite successfully', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        error: null,
      })

      const result = await AdminService.deleteInvite(mockSupabase as unknown as SupabaseClient, 'ra-1')

      expect(result.success).toBe(true)
    })

    it('should return error on failure', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.recruiter_access._builder._setThenValue({
        error: { message: 'Delete failed' },
      })

      const result = await AdminService.deleteInvite(mockSupabase as unknown as SupabaseClient, 'ra-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete invite')
    })
  })

  // ───────────────────────────────────────────────────────────────
  // getAllChapters
  // ───────────────────────────────────────────────────────────────
  describe('getAllChapters', () => {
    it('should return all chapters ordered by name', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.chapter._builder._setThenValue({
        data: [
          { id: 'ch-1', name: 'Alpha Chapter', university: 'Uni A', city: 'City A', region: 'Region A', created_at: '2024-01-01', updated_at: '2024-01-01', instagram_url: null, latitude: null, longitude: null, location_point: null },
          { id: 'ch-2', name: 'Beta Chapter', university: 'Uni B', city: 'City B', region: 'Region B', created_at: '2024-02-01', updated_at: '2024-02-01', instagram_url: null, latitude: null, longitude: null, location_point: null },
        ],
        error: null,
      })

      const result = await AdminService.getAllChapters(mockSupabase as unknown as SupabaseClient)

      if ('error' in result) {
        throw new Error('Expected chapters')
      }

      expect(result.chapters).toHaveLength(2)
      expect(result.chapters[0].name).toBe('Alpha Chapter')
      expect(result.chapters[1].name).toBe('Beta Chapter')
    })

    it('should return error on failure', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase()

      tableMocks.chapter._builder._setThenValue({
        data: null,
        error: { message: 'DB error' },
      })

      const result = await AdminService.getAllChapters(mockSupabase as unknown as SupabaseClient)

      if ('chapters' in result) {
        throw new Error('Expected error')
      }

      expect(result.error).toBe('Failed to fetch chapters')
    })
  })
})
