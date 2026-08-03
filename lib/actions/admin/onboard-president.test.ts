import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdminMock = vi.hoisted(() => vi.fn())
const revalidatePathMock = vi.hoisted(() => vi.fn())
const getOrIssueLeadIdMock = vi.hoisted(() => vi.fn())
const assignChapterRoleMock = vi.hoisted(() => vi.fn())
const onboardPresidentMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  requireAdmin: requireAdminMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
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

vi.mock('@/lib/services/chapter-president.service', () => ({
  onboardPresident: onboardPresidentMock,
}))

// --- Per-table, queued mock builder (mirrors chapter-preapproval.service.test.ts) ---

type QueryResult = { data: unknown; error: unknown }
type TableName = 'user' | 'chapter' | 'chapter_membership'

type MockBuilder = {
  select: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  match: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
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
  }

  const supabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
  }

  return { supabase, tableMocks }
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
    getOrIssueLeadIdMock.mockResolvedValue({
      success: true,
      data: 'LEAD-123456',
    })
    assignChapterRoleMock.mockResolvedValue({
      success: true,
      roleAssignmentId: 'role-1',
      grantedPermissions: ['chapter.dashboard.access'],
    })
    onboardPresidentMock.mockResolvedValue({ success: true })
  })

  it('succeeds with valid email and chapter', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: { id: 'leaduni', name: 'LEAD University' }, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_membership.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        chapter_id: 'leaduni',
        status: 'approved',
        member_id: 'LEAD-123456',
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

  it('fails if user not found by email', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'User not found with that email.' })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('fails if chapter not found', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'Chapter not found.' })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('fails if user already has approved membership in this chapter', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: { id: 'leaduni', name: 'LEAD University' }, error: null })
    tableMocks.chapter_membership._setResult({
      data: {
        id: 'membership-1',
        status: 'approved',
        member_id: 'LEAD-999999',
        joined_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'User already has an approved membership in this chapter.' })
    expect(assignChapterRoleMock).not.toHaveBeenCalled()
  })

  it('updates existing unapproved membership instead of inserting', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: { id: 'leaduni', name: 'LEAD University' }, error: null })
    tableMocks.chapter_membership._setResult({
      data: { id: 'membership-1', status: 'pending', member_id: null, joined_at: null },
      error: null,
    })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_membership.update).toHaveBeenCalled()
    expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
  })

  it('fails if assignChapterRole fails', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: { id: 'leaduni', name: 'LEAD University' }, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })
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
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: { id: 'leaduni', name: 'LEAD University' }, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })
    onboardPresidentMock.mockResolvedValue({ success: false, error: 'Failed to issue LEAD identity.' })

    const { onboardPresidentAction } = await import('./onboard-president')
    const result = await onboardPresidentAction(validInput)

    expect(result).toEqual({ success: false, error: 'Failed to issue LEAD identity.' })
  })

  it('accepts custom functionalArea and displayTitle', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: { id: 'leaduni', name: 'LEAD University' }, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

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
      })
    )
  })

  it('uses defaults for functionalArea and displayTitle when omitted', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({
      data: { id: 'user-1', email: 'president@test.com', role: 'member' },
      error: null,
    })
    tableMocks.chapter._setResult({ data: { id: 'leaduni', name: 'LEAD University' }, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

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
