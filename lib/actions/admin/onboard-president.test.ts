import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdminMock = vi.hoisted(() => vi.fn())
const revalidatePathMock = vi.hoisted(() => vi.fn())
const createAdminClientMock = vi.hoisted(() => vi.fn())
const getOrIssueLeadIdMock = vi.hoisted(() => vi.fn())
const assignChapterRoleMock = vi.hoisted(() => vi.fn())
const grantRoleTemplatePermissionsMock = vi.hoisted(() => vi.fn())
const onboardPresidentMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  requireAdmin: requireAdminMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/services/person-profile.service', () => ({
  PersonProfileService: {
    getOrIssueLeadId: getOrIssueLeadIdMock,
  },
}))

vi.mock('@/lib/services/chapter-role-assignment.service', () => ({
  ChapterRoleAssignmentService: {
    assignChapterRole: assignChapterRoleMock,
  },
}))

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    grantRoleTemplatePermissions: grantRoleTemplatePermissionsMock,
  },
}))

vi.mock('@/lib/services/chapter-president.service', () => ({
  onboardPresident: onboardPresidentMock,
}))

// --- Per-table, queued mock builder (mirrors chapter-preapproval.service.test.ts) ---

type QueryResult = { data: unknown; error: unknown }
type TableName = 'user' | 'chapter' | 'chapter_membership' | 'chapter_role_assignment'

type MockBuilder = {
  select: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  match: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
  _setResult: (value: QueryResult) => void
}

function createBuilder(defaultValue: QueryResult = { data: null, error: null }): MockBuilder {
  const valueQueue: QueryResult[] = []
  let fallback = defaultValue

  const shiftValue = () => {
    if (valueQueue.length > 0) return valueQueue.shift() as QueryResult
    return fallback
  }

  const builder: MockBuilder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    match: vi.fn(() => builder),
    is: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(shiftValue())),
    maybeSingle: vi.fn(() => Promise.resolve(shiftValue())),
    then: vi.fn((resolve: (value: QueryResult) => unknown) => resolve(shiftValue())),
    _setResult: (value: QueryResult) => {
      valueQueue.push(value)
      fallback = value
    },
  }

  return builder
}

function buildMockSupabase() {
  const tableMocks: Record<TableName, MockBuilder> = {
    user: createBuilder(),
    chapter: createBuilder(),
    chapter_membership: createBuilder(),
    chapter_role_assignment: createBuilder(),
  }

  const supabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
  }

  return { supabase, tableMocks }
}

// --- Admin client mock ---

const adminInsertBuilder = {
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
}

const adminClientMock = {
  auth: {
    admin: {
      getUserById: vi.fn(),
      updateUserById: vi.fn(),
      createUser: vi.fn(),
    },
  },
  from: vi.fn(() => adminInsertBuilder),
}

function existingUser(overrides: Record<string, unknown> = {}) {
  return { id: 'user-1', email: 'president@test.com', role: 'member', ...overrides }
}

function existingChapter(overrides: Record<string, unknown> = {}) {
  return { id: 'leaduni', name: 'LEAD University', ...overrides }
}

function approvedMembership(overrides: Record<string, unknown> = {}) {
  return {
    id: 'membership-1',
    status: 'approved',
    member_id: 'LEAD-123456',
    joined_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function presidentRole(overrides: Record<string, unknown> = {}) {
  return {
    id: 'role-1',
    role_level: 'president',
    status: 'active',
    ...overrides,
  }
}

describe('onboardPresidentAction', () => {
  const validInput = {
    email: 'president@test.com',
    chapterId: 'leaduni',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({
      supabase: {},
      user: { id: 'admin-1' },
    })
    createAdminClientMock.mockReturnValue(adminClientMock)
    adminClientMock.auth.admin.getUserById.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'president@test.com', email_confirmed_at: '2026-01-01T00:00:00.000Z' } },
      error: null,
    })
    adminClientMock.auth.admin.updateUserById.mockResolvedValue({ data: { user: null }, error: null })
    adminClientMock.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'created-user-1', email: 'president@test.com' } },
      error: null,
    })
    getOrIssueLeadIdMock.mockResolvedValue({
      success: true,
      data: 'LEAD-123456',
    })
    assignChapterRoleMock.mockResolvedValue({
      success: true,
      roleAssignmentId: 'role-1',
      grantedPermissions: ['chapter.dashboard.access'],
    })
    grantRoleTemplatePermissionsMock.mockResolvedValue({
      success: true,
      grantedPermissions: ['chapter.dashboard.access'],
    })
    onboardPresidentMock.mockResolvedValue({ success: true })
  })

  function baseTables() {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: existingUser(), error: null })
    tableMocks.chapter._setResult({ data: existingChapter(), error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })
    return { supabase, tableMocks }
  }

  function seedCrossChapterList(tableMocks: ReturnType<typeof buildMockSupabase>['tableMocks'], rows: Array<Record<string, unknown>> = []) {
    tableMocks.chapter_membership._setResult({ data: rows, error: null })
  }

  function seedExistingMembership(
    tableMocks: ReturnType<typeof buildMockSupabase>['tableMocks'],
    value: Record<string, unknown> | null
  ) {
    tableMocks.chapter_membership._setResult({ data: value, error: null })
  }

  function seedExistingRole(
    tableMocks: ReturnType<typeof buildMockSupabase>['tableMocks'],
    value: Record<string, unknown> | null
  ) {
    tableMocks.chapter_role_assignment._setResult({ data: value, error: null })
  }

  function seedRoleUpdate(tableMocks: ReturnType<typeof buildMockSupabase>['tableMocks']) {
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
  }

  it('succeeds with valid email and chapter, inserting an approved president membership', async () => {
    const { supabase, tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, null)
    seedExistingRole(tableMocks, null)

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_membership.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        chapter_id: 'leaduni',
        status: 'approved',
        member_id: 'LEAD-123456',
        position: 'president',
      })
    )
    expect(assignChapterRoleMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        targetUserId: 'user-1',
        chapterId: 'leaduni',
        roleLevel: 'president',
      })
    )
    expect(onboardPresidentMock).toHaveBeenCalledWith(supabase, {
      userId: 'user-1',
      chapterId: 'leaduni',
      grantedById: 'admin-1',
    })
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
  })

  it('rejects invalid email', async () => {
    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction({ ...validInput, email: 'not-an-email' })

    expect(result).toEqual({ success: false, error: 'Enter a valid email and select a chapter.' })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('rejects empty chapterId', async () => {
    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction({ ...validInput, chapterId: '' })

    expect(result).toEqual({ success: false, error: 'Enter a valid email and select a chapter.' })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('fails if chapter not found', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'Chapter not found.' })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('returns success without changes when membership and president role are already active', async () => {
    const { tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, approvedMembership())
    seedExistingRole(tableMocks, presidentRole())

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
    expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
    expect(onboardPresidentMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
  })

  it('reactivates a deactivated president role for an approved member', async () => {
    const { supabase, tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, approvedMembership())
    seedExistingRole(tableMocks, presidentRole({ status: 'inactive' }))
    seedRoleUpdate(tableMocks)

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_role_assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', ends_at: null })
    )
    expect(grantRoleTemplatePermissionsMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        userId: 'user-1',
        chapterId: 'leaduni',
        roleLevel: 'president',
        grantedById: 'admin-1',
        source: 'role_template',
        sourceRoleAssignmentId: 'role-1',
      })
    )
    expect(onboardPresidentMock).toHaveBeenCalledWith(supabase, {
      userId: 'user-1',
      chapterId: 'leaduni',
      grantedById: 'admin-1',
    })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('rejects onboarding a user already approved in another chapter', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: existingUser(), error: null })
    tableMocks.chapter._setResult({ data: existingChapter(), error: null })
    tableMocks.chapter_membership._setResult({ data: [{ chapter_id: 'other-chapter' }], error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({
      success: false,
      error: 'This account already belongs to another chapter. Contact support before onboarding.',
    })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('upgrades an existing unapproved membership to approved president', async () => {
    const { tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, {
      id: 'membership-1',
      status: 'pending',
      member_id: null,
      joined_at: null,
    })
    seedExistingRole(tableMocks, null)

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        member_id: 'LEAD-123456',
        position: 'president',
      })
    )
    expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
  })

  it('fails if assignChapterRole fails', async () => {
    const { tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, null)
    seedExistingRole(tableMocks, null)
    assignChapterRoleMock.mockResolvedValue({
      success: false,
      error: 'Target user must be an approved member of this chapter.',
    })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'Target user must be an approved member of this chapter.' })
    expect(onboardPresidentMock).not.toHaveBeenCalled()
  })

  it('fails if onboardPresident fails', async () => {
    const { tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, null)
    seedExistingRole(tableMocks, null)
    onboardPresidentMock.mockResolvedValue({ success: false, error: 'Failed to issue LEAD identity.' })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'Failed to issue LEAD identity.' })
  })

  it('confirms an existing auth account that has not confirmed email', async () => {
    const { tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, null)
    seedExistingRole(tableMocks, null)
    adminClientMock.auth.admin.getUserById.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'president@test.com', email_confirmed_at: null } },
      error: null,
    })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(adminClientMock.auth.admin.getUserById).toHaveBeenCalledWith('user-1')
    expect(adminClientMock.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', { email_confirm: true })
  })

  it('does not touch confirmation when the auth account is already confirmed', async () => {
    const { tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, null)
    seedExistingRole(tableMocks, null)

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(adminClientMock.auth.admin.updateUserById).not.toHaveBeenCalled()
  })

  it('auto-creates the auth account and reuses the public user created by the trigger', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: null, error: null })
    tableMocks.user._setResult({ data: { id: 'created-user-1', email: 'president@test.com' }, error: null })
    tableMocks.chapter._setResult({ data: existingChapter(), error: null })
    tableMocks.chapter_membership._setResult({ data: [], error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(adminClientMock.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'president@test.com',
      email_confirm: true,
    })
    expect(adminClientMock.from).not.toHaveBeenCalled()
    expect(tableMocks.chapter_membership.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'created-user-1', position: 'president' })
    )
  })

  it('falls back to a manual public user insert when the trigger did not run', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: null, error: null })
    tableMocks.user._setResult({ data: null, error: null })
    tableMocks.chapter._setResult({ data: existingChapter(), error: null })
    tableMocks.chapter_membership._setResult({ data: [], error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(adminClientMock.from).toHaveBeenCalledWith('user')
    expect(adminInsertBuilder.insert).toHaveBeenCalledWith({
      id: 'created-user-1',
      email: 'president@test.com',
      name: '',
      role: 'member',
    })
  })

  it('fails when the auth account cannot be created', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: null, error: null })
    tableMocks.chapter._setResult({ data: existingChapter(), error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })
    adminClientMock.auth.admin.createUser.mockResolvedValue({ data: { user: null }, error: { message: 'dup' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'Failed to create the account.' })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('accepts custom functionalArea and displayTitle', async () => {
    const { supabase, tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, null)
    seedExistingRole(tableMocks, null)

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction({
      ...validInput,
      functionalArea: 'strategy_operations',
      displayTitle: 'Presidenta',
    })

    expect(result).toEqual({ success: true })
    expect(assignChapterRoleMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        functionalArea: 'strategy_operations',
        displayTitle: 'Presidenta',
        rawTitle: 'Presidenta',
      })
    )
  })

  it('uses defaults for functionalArea and displayTitle when omitted', async () => {
    const { supabase, tableMocks } = baseTables()
    seedCrossChapterList(tableMocks, [])
    seedExistingMembership(tableMocks, null)
    seedExistingRole(tableMocks, null)

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(assignChapterRoleMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        functionalArea: 'general_leadership',
        displayTitle: 'President',
        rawTitle: 'President',
      })
    )
  })
})
