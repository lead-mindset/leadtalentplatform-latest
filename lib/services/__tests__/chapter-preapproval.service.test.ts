import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { generateUniqueMemberId } from '@/lib/utils/member-id'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import {
  ChapterPreapprovalService,
  normalizePreapprovalEmail,
} from '../chapter-preapproval.service'

vi.mock('@/lib/utils/member-id', () => ({
  generateUniqueMemberId: vi.fn(),
}))

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    grantRoleTemplatePermissions: vi.fn(),
  },
}))

type MockFn = ReturnType<typeof vi.fn>
type QueryResult = { data: unknown; error: { message?: string } | null }

type MockBuilder = {
  select: MockFn
  update: MockFn
  insert: MockFn
  eq: MockFn
  match: MockFn
  is: MockFn
  gt: MockFn
  order: MockFn
  limit: MockFn
  single: MockFn
  maybeSingle: MockFn
  then: MockFn
  _setResult: (value: QueryResult) => void
}

type TableName =
  | 'chapter_preapproval'
  | 'chapter_membership'
  | 'chapter_role_assignment'

function createBuilder(defaultValue: QueryResult = { data: null, error: null }): MockBuilder {
  const valueQueue: QueryResult[] = []
  let fallback = defaultValue

  const shiftValue = () => {
    if (valueQueue.length > 0) {
      return valueQueue.shift() ?? fallback
    }
    return fallback
  }

  const builder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    match: vi.fn(() => builder),
    is: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
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
    chapter_preapproval: createBuilder(),
    chapter_membership: createBuilder(),
    chapter_role_assignment: createBuilder(),
  }

  const mockSupabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
  } as unknown as SupabaseClient<Database>

  return { mockSupabase, tableMocks }
}

function memberPreapproval(overrides: Record<string, unknown> = {}) {
  return {
    id: 'preapproval-1',
    email: 'Leader@Test.com',
    normalized_email: 'leader@test.com',
    chapter_id: 'leaduni',
    preapproval_type: 'member',
    role_level: null,
    functional_area: null,
    display_title: null,
    raw_title: null,
    expires_at: '2026-12-31T00:00:00.000Z',
    consumed_at: null,
    consumed_by_user_id: null,
    revoked_at: null,
    revoked_by_id: null,
    created_by_id: 'admin-1',
    source: 'manual_import',
    notes: null,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
    ...overrides,
  }
}

function eboardPreapproval(overrides: Record<string, unknown> = {}) {
  return memberPreapproval({
    preapproval_type: 'eboard',
    role_level: 'president',
    functional_area: 'general_leadership',
    display_title: 'Presidenta',
    raw_title: 'Presidenta',
    ...overrides,
  })
}

describe('ChapterPreapprovalService', () => {
  beforeEach(() => {
    vi.mocked(generateUniqueMemberId).mockReset()
    vi.mocked(generateUniqueMemberId).mockResolvedValue('LEAD-123456')
    vi.mocked(ChapterPermissionService.grantRoleTemplatePermissions).mockReset()
    vi.mocked(ChapterPermissionService.grantRoleTemplatePermissions).mockResolvedValue({
      success: true,
      grantedPermissions: ['chapter.dashboard.access'],
    })
  })

  it('normalizes preapproval email by trimming and lowercasing', () => {
    expect(normalizePreapprovalEmail('  Leader@Test.COM  ')).toBe('leader@test.com')
  })

  it('creates approved membership for a matching preapproved member email', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: memberPreapproval(), error: null })
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })

    const result = await ChapterPreapprovalService.activatePreapprovalForUser(mockSupabase, {
      userId: 'user-1',
      email: ' Leader@Test.COM ',
    })

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        activated: true,
        preapprovalId: 'preapproval-1',
        chapterId: 'leaduni',
        preapprovalType: 'member',
        memberId: 'LEAD-123456',
      })
    )
    expect(tableMocks.chapter_preapproval.eq).toHaveBeenCalledWith('normalized_email', 'leader@test.com')
    expect(tableMocks.chapter_preapproval.is).toHaveBeenCalledWith('revoked_at', null)
    expect(tableMocks.chapter_preapproval.is).toHaveBeenCalledWith('consumed_at', null)
    expect(tableMocks.chapter_preapproval.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
    expect(tableMocks.chapter_membership.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        chapter_id: 'leaduni',
        status: 'approved',
        position: 'member',
        member_id: 'LEAD-123456',
      })
    )
    expect(tableMocks.chapter_preapproval.update).toHaveBeenCalledWith(
      expect.objectContaining({
        consumed_by_user_id: 'user-1',
      })
    )
    expect(ChapterPermissionService.grantRoleTemplatePermissions).not.toHaveBeenCalled()
  })

  it('updates an existing pending membership for a matching preapproval', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: memberPreapproval(), error: null })
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({
      data: {
        id: 'membership-1',
        status: 'pending',
        member_id: null,
        position: 'member',
        joined_at: null,
        approved_by_id: null,
      },
      error: null,
    })
    tableMocks.chapter_membership._setResult({ data: null, error: null })

    const result = await ChapterPreapprovalService.activatePreapprovalForUser(mockSupabase, {
      userId: 'user-1',
      email: 'leader@test.com',
      activatedById: 'admin-1',
    })

    expect(result).toEqual(expect.objectContaining({ success: true, activated: true }))
    expect(tableMocks.chapter_membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        approved_by_id: 'admin-1',
        status: 'approved',
        member_id: 'LEAD-123456',
      })
    )
    expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
  })

  it('creates role assignment and grants template permissions for e-board preapproval', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: eboardPreapproval(), error: null })
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'role-1', role_level: 'president' }, error: null })

    const result = await ChapterPreapprovalService.activatePreapprovalForUser(mockSupabase, {
      userId: 'leader-1',
      email: 'leader@test.com',
      activatedById: 'admin-1',
    })

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        activated: true,
        roleAssignmentId: 'role-1',
        grantedPermissions: ['chapter.dashboard.access'],
      })
    )
    expect(tableMocks.chapter_role_assignment.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'leader-1',
        chapter_id: 'leaduni',
        role_level: 'president',
        functional_area: 'general_leadership',
        display_title: 'Presidenta',
        raw_title: 'Presidenta',
        is_primary: true,
        status: 'active',
        assigned_by_id: 'admin-1',
        source: 'preapproval',
        source_preapproval_id: 'preapproval-1',
      })
    )
    expect(ChapterPermissionService.grantRoleTemplatePermissions).toHaveBeenCalledWith(
      mockSupabase,
      {
        userId: 'leader-1',
        chapterId: 'leaduni',
        roleLevel: 'president',
        grantedById: 'admin-1',
        source: 'preapproval',
        sourceRoleAssignmentId: 'role-1',
      }
    )
  })

  it('does not duplicate approved membership or role assignment when matching records already exist', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: eboardPreapproval(), error: null })
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({
      data: {
        id: 'membership-1',
        status: 'approved',
        member_id: 'LEAD-999999',
        position: 'member',
        joined_at: '2026-05-01T00:00:00.000Z',
        approved_by_id: 'admin-1',
      },
      error: null,
    })
    tableMocks.chapter_role_assignment._setResult({
      data: { id: 'role-1', role_level: 'president' },
      error: null,
    })

    const result = await ChapterPreapprovalService.activatePreapprovalForUser(mockSupabase, {
      userId: 'leader-1',
      email: 'leader@test.com',
    })

    expect(result).toEqual(expect.objectContaining({ success: true, activated: true, memberId: 'LEAD-999999' }))
    expect(vi.mocked(generateUniqueMemberId)).not.toHaveBeenCalled()
    expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
    expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    expect(tableMocks.chapter_role_assignment.insert).not.toHaveBeenCalled()
    expect(ChapterPermissionService.grantRoleTemplatePermissions).toHaveBeenCalledOnce()
  })

  it('does nothing for missing, expired, revoked, consumed, or email-mismatched preapprovals', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })

    const result = await ChapterPreapprovalService.activatePreapprovalForUser(mockSupabase, {
      userId: 'user-1',
      email: 'different@test.com',
    })

    expect(result).toEqual({ success: true, activated: false, reason: 'no_matching_preapproval' })
    expect(tableMocks.chapter_membership.insert).not.toHaveBeenCalled()
    expect(tableMocks.chapter_membership.update).not.toHaveBeenCalled()
    expect(tableMocks.chapter_role_assignment.insert).not.toHaveBeenCalled()
    expect(ChapterPermissionService.grantRoleTemplatePermissions).not.toHaveBeenCalled()
  })

  it('does not consume preapproval if permission grant fails', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: eboardPreapproval(), error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_membership._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: null, error: null })
    tableMocks.chapter_role_assignment._setResult({ data: { id: 'role-1', role_level: 'president' }, error: null })
    vi.mocked(ChapterPermissionService.grantRoleTemplatePermissions).mockResolvedValue({
      success: false,
      error: 'Failed to grant chapter permissions.',
    })

    const result = await ChapterPreapprovalService.activatePreapprovalForUser(mockSupabase, {
      userId: 'leader-1',
      email: 'leader@test.com',
    })

    expect(result).toEqual({ success: false, error: 'Failed to grant chapter permissions.' })
    expect(tableMocks.chapter_preapproval.update).not.toHaveBeenCalled()
  })
})
