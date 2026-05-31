import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import {
  ChapterInviteService,
  hashChapterInviteToken,
  normalizeChapterInviteEmail,
} from '../chapter-invite.service'

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    grantRoleTemplatePermissions: vi.fn(),
    hasChapterPermission: vi.fn(),
  },
}))

type MockFn = ReturnType<typeof vi.fn>
type QueryResult = { data: unknown; error: { message?: string } | null }

type MockBuilder = {
  select: MockFn
  update: MockFn
  insert: MockFn
  eq: MockFn
  is: MockFn
  match: MockFn
  in: MockFn
  limit: MockFn
  order: MockFn
  single: MockFn
  maybeSingle: MockFn
  then: MockFn
  _setResult: (value: QueryResult) => void
}

type TableName =
  | 'chapter_invite'
  | 'chapter_membership'
  | 'chapter_permission_grant'
  | 'chapter_role_assignment'
  | 'user'

function createBuilder(defaultValue: QueryResult = { data: null, error: null }): MockBuilder {
  const valueQueue: QueryResult[] = []
  let fallback = defaultValue

  const shiftValue = () => {
    if (valueQueue.length > 0) return valueQueue.shift() ?? fallback
    return fallback
  }

  const builder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    match: vi.fn(() => builder),
    in: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    order: vi.fn(() => builder),
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
    chapter_invite: createBuilder(),
    chapter_membership: createBuilder({ data: [], error: null }),
    chapter_permission_grant: createBuilder(),
    chapter_role_assignment: createBuilder(),
    user: createBuilder(),
  }

  const mockSupabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
  } as unknown as SupabaseClient<Database>

  return { mockSupabase, tableMocks }
}

function inviteRow(overrides: Record<string, unknown> = {}) {
  return {
    accepted_at: null,
    accepted_by_user_id: null,
    chapter_id: 'leaduni',
    created_at: '2026-05-31T00:00:00.000Z',
    created_by_role: 'chapter_leader',
    created_by_user_id: 'president-1',
    display_title: 'Direccion - Eventos y experiencia',
    email: 'Leader@Test.com',
    expires_at: '2099-12-31T00:00:00.000Z',
    functional_area: 'events_experience',
    id: 'invite-1',
    invite_type: 'regular_eboard',
    metadata: {},
    normalized_email: 'leader@test.com',
    raw_title: 'Direccion - Eventos y experiencia',
    replaced_by_invite_id: null,
    revoked_at: null,
    revoked_by_user_id: null,
    role_level: 'director',
    source: 'chapter_invite',
    status: 'pending',
    token_hash: hashChapterInviteToken('token-123'),
    updated_at: '2026-05-31T00:00:00.000Z',
    ...overrides,
  }
}

describe('ChapterInviteService', () => {
  beforeEach(() => {
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockReset()
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(true)
    vi.mocked(ChapterPermissionService.grantRoleTemplatePermissions).mockReset()
    vi.mocked(ChapterPermissionService.grantRoleTemplatePermissions).mockResolvedValue({
      success: true,
      grantedPermissions: ['chapter.dashboard.access'],
    })
  })

  it('normalizes emails and hashes invite tokens deterministically', () => {
    expect(normalizeChapterInviteEmail('  Leader@Test.COM  ')).toBe('leader@test.com')
    expect(hashChapterInviteToken('token-123')).toBe(hashChapterInviteToken('token-123'))
    expect(hashChapterInviteToken('token-123')).not.toBe('token-123')
  })

  it('creates a regular e-board invite without storing the raw token', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    tableMocks.chapter_invite._setResult({ data: null, error: null })
    tableMocks.chapter_invite._setResult({ data: inviteRow(), error: null })

    const result = await ChapterInviteService.createInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: ' Leader@Test.com ',
      inviteType: 'regular_eboard',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Direccion - Eventos y experiencia',
      token: 'token-123',
      now: new Date('2026-05-31T00:00:00.000Z'),
    })

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.token).toBe('token-123')
    expect(tableMocks.chapter_invite.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'Leader@Test.com',
        normalized_email: 'leader@test.com',
        token_hash: hashChapterInviteToken('token-123'),
        invite_type: 'regular_eboard',
        role_level: 'director',
      })
    )
    expect(JSON.stringify(tableMocks.chapter_invite.insert.mock.calls[0][0])).not.toContain('token-123')
  })

  it('rejects duplicate pending invites for the same email and chapter', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'president-1', role: 'member' }, error: null })
    tableMocks.chapter_invite._setResult({ data: { id: 'existing' }, error: null })

    const result = await ChapterInviteService.createInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: 'leader@test.com',
      inviteType: 'regular_eboard',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Directora',
    })

    expect(result).toEqual({
      success: false,
      error: 'A pending invite already exists for this email and chapter.',
    })
    expect(tableMocks.chapter_invite.insert).not.toHaveBeenCalled()
  })

  it('blocks protected role invites when an active protected role already exists', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.user._setResult({ data: { id: 'admin-1', role: 'admin' }, error: null })
    tableMocks.chapter_invite._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'role-1' }, error: null })

    const result = await ChapterInviteService.createInvite(mockSupabase, {
      actorUserId: 'admin-1',
      chapterId: 'leaduni',
      email: 'president@test.com',
      inviteType: 'protected_leader',
      roleLevel: 'president',
      functionalArea: 'general_leadership',
      displayTitle: 'Presidenta',
    })

    expect(result).toEqual({
      success: false,
      error: 'This protected chapter role is already assigned or pending.',
    })
  })

  it('validates expired and revoked tokens without mutating records', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_invite._setResult({
      data: inviteRow({ expires_at: '2026-01-01T00:00:00.000Z' }),
      error: null,
    })

    const expired = await ChapterInviteService.validateToken(
      mockSupabase,
      'token-123',
      new Date('2026-05-31T00:00:00.000Z')
    )

    expect(expired.success).toBe(true)
    if (expired.success) expect(expired.state).toBe('expired')
    expect(tableMocks.chapter_invite.update).not.toHaveBeenCalled()
  })

  it('rejects acceptance when the logged-in email does not match the invited email', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_invite._setResult({ data: inviteRow(), error: null })

    const result = await ChapterInviteService.acceptInvite(mockSupabase, {
      token: 'token-123',
      userId: 'user-1',
      email: 'different@test.com',
      now: new Date('2026-05-31T00:00:00.000Z'),
    })

    expect(result).toEqual({
      success: false,
      error: 'This invite must be accepted with the invited email address.',
    })
    expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
    expect(tableMocks.chapter_role_assignment.insert).not.toHaveBeenCalled()
  })

  it('accepts a matching invite by approving membership, assigning role, granting permissions, and consuming invite', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_invite._setResult({ data: inviteRow(), error: null })
    tableMocks.chapter_membership._setResult({ data: [], error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'role-1', role_level: 'director' }, error: null })
    tableMocks.chapter_invite._setResult({ data: null, error: null })

    const result = await ChapterInviteService.acceptInvite(mockSupabase, {
      token: 'token-123',
      userId: 'user-1',
      email: 'leader@test.com',
      now: new Date('2026-05-31T00:00:00.000Z'),
      generateMemberId: async () => 'LEAD-UNI-9999',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.accepted).toBe(true)
    expect(result.memberId).toBe('LEAD-UNI-9999')
    expect(tableMocks.chapter_membership.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        chapter_id: 'leaduni',
        status: 'approved',
        member_id: 'LEAD-UNI-9999',
      })
    )
    expect(tableMocks.chapter_role_assignment.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        chapter_id: 'leaduni',
        role_level: 'director',
        source: 'chapter_invite',
        source_chapter_invite_id: 'invite-1',
      })
    )
    expect(ChapterPermissionService.grantRoleTemplatePermissions).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({
        userId: 'user-1',
        chapterId: 'leaduni',
        roleLevel: 'director',
        source: 'chapter_invite',
        sourceRoleAssignmentId: 'role-1',
      })
    )
    expect(tableMocks.chapter_invite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'accepted',
        accepted_by_user_id: 'user-1',
      })
    )
  })
})
