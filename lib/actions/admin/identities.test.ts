import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'

const requireAdminMock = vi.hoisted(() => vi.fn())
const revalidatePathMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  requireAdmin: requireAdminMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

// --- Queued, per-table mock builder (mirrors lead-identity.service.test.ts) ---

type QueryResult = { data: unknown; error: unknown }

const createBuilder = (defaultValue: QueryResult = { data: [], error: null }) => {
  const valueQueue: QueryResult[] = []
  let fallback = defaultValue

  const shiftValue = () => {
    if (valueQueue.length > 0) return valueQueue.shift() as QueryResult
    return fallback
  }

  const builder: Record<string, unknown> = {
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(shiftValue())),
    single: vi.fn(() => Promise.resolve(shiftValue())),
    then: vi.fn((resolve: (value: unknown) => unknown) => resolve(shiftValue())),
    _setThenValue: (value: QueryResult) => {
      valueQueue.push(value)
      fallback = value
    },
  }

  return builder
}

function buildMockSupabase() {
  const chapterMembershipBuilder = createBuilder()
  const leadIdentityBuilder = createBuilder()

  const tableMocks: Record<string, Record<string, unknown>> = {
    chapter_membership: {
      select: vi.fn(() => chapterMembershipBuilder),
      _builder: chapterMembershipBuilder,
    },
    lead_identity: {
      select: vi.fn(() => leadIdentityBuilder),
      update: vi.fn(() => leadIdentityBuilder),
      insert: vi.fn(() => leadIdentityBuilder),
      _builder: leadIdentityBuilder,
    },
  }

  const supabase = {
    from: vi.fn((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { supabase, tableMocks }
}

const activeIdentity = {
  id: 'identity-1',
  user_id: 'user-1',
  identity_type: 'chapter_editor',
  chapter_id: 'leaduni',
  is_primary: false,
  issued_by_id: 'admin-1',
  issued_at: '2026-05-03T00:00:00.000Z',
  revoked_at: null,
  status: 'active',
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
}

const validUserId = '123e4567-e89b-42d3-a456-426614174000'
const validChapterId = 'leaduni'

describe('issueLeadIdentity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({
      supabase: {},
      user: { id: 'admin-1' },
    })
  })

  it('rejects a chapter-scoped identity when the target has no chapter membership (regression: president created with no membership)', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { issueLeadIdentity } = await import('./identities')
    const result = await issueLeadIdentity({
      userId: validUserId,
      identityType: 'chapter_editor',
      chapterId: validChapterId,
      makePrimary: true,
    })

    expect(result).toEqual({
      success: false,
      error: 'Cannot issue a chapter-scoped identity. Assign membership first.',
    })
    expect(tableMocks.lead_identity.insert).not.toHaveBeenCalled()
    expect(tableMocks.lead_identity.update).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it('rejects a chapter-scoped identity when the membership is pending', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_membership._builder._setThenValue({
      data: { user_id: validUserId, chapter_id: validChapterId, status: 'pending' },
      error: null,
    })
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { issueLeadIdentity } = await import('./identities')
    const result = await issueLeadIdentity({
      userId: validUserId,
      identityType: 'chapter_member',
      chapterId: validChapterId,
    })

    expect(result).toEqual({
      success: false,
      error: 'Cannot issue a chapter-scoped identity. Assign membership first.',
    })
    expect(tableMocks.lead_identity.insert).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it('issues a chapter-scoped identity for an approved membership and revalidates the admin paths', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_membership._builder._setThenValue({
      data: { user_id: validUserId, chapter_id: validChapterId, status: 'approved' },
      error: null,
    })
    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: activeIdentity, error: null })

    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { issueLeadIdentity } = await import('./identities')
    const result = await issueLeadIdentity({
      userId: validUserId,
      identityType: 'chapter_editor',
      chapterId: validChapterId,
      makePrimary: false,
    })

    expect(result.success).toBe(true)
    expect(tableMocks.lead_identity.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: validUserId,
        identity_type: 'chapter_editor',
        chapter_id: validChapterId,
        status: 'active',
      })
    )
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/users')
    expect(revalidatePathMock).toHaveBeenCalledWith(`/admin/users/${validUserId}`)
  })

  it('issues founder and staff identities without requiring a chapter membership', async () => {
    const { supabase, tableMocks } = buildMockSupabase()
    const founderIdentity = { ...activeIdentity, identity_type: 'founder', chapter_id: null }

    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: founderIdentity, error: null })

    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { issueLeadIdentity } = await import('./identities')
    const result = await issueLeadIdentity({
      userId: validUserId,
      identityType: 'founder',
    })

    expect(result.success).toBe(true)
    expect(tableMocks.chapter_membership.select).not.toHaveBeenCalled()
    expect(tableMocks.lead_identity.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        identity_type: 'founder',
        chapter_id: null,
      })
    )
    expect(revalidatePathMock).toHaveBeenCalled()
  })

  it('returns a validation error for an invalid user id', async () => {
    const { supabase } = buildMockSupabase()
    requireAdminMock.mockResolvedValue({ supabase, user: { id: 'admin-1' } })

    const { issueLeadIdentity } = await import('./identities')
    const result = await issueLeadIdentity({
      userId: 'not-a-uuid',
      identityType: 'chapter_member',
      chapterId: validChapterId,
    })

    expect(result).toEqual({
      success: false,
      error: 'Enter a valid LEAD identity request.',
    })
    expect(requireAdminMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it('does not issue an identity when requireAdmin rejects the request', async () => {
    requireAdminMock.mockRejectedValue(new Error('Unauthorized'))

    const { issueLeadIdentity } = await import('./identities')
    await expect(
      issueLeadIdentity({
        userId: validUserId,
        identityType: 'chapter_editor',
        chapterId: validChapterId,
      })
    ).rejects.toThrow('Unauthorized')
  })
})
