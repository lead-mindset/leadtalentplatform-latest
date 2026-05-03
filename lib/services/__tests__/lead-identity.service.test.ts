import { describe, expect, it, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { LeadIdentityService } from '../lead-identity.service'

const buildMockSupabase = () => {
  const createBuilder = () => {
    const valueQueue: unknown[] = []
    let defaultValue: unknown = { data: [], error: null }

    const shiftValue = () => {
      if (valueQueue.length > 0) return valueQueue.shift()!
      return defaultValue
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
      _setThenValue: (value: unknown) => {
        valueQueue.push(value)
        defaultValue = value
      },
    }

    return builder
  }

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

  const mockSupabase = {
    from: vi.fn((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

const activeIdentity = {
  id: 'identity-1',
  user_id: 'user-1',
  identity_type: 'chapter_member',
  chapter_id: 'leaduni',
  is_primary: false,
  issued_by_id: 'admin-1',
  issued_at: '2026-05-03T00:00:00.000Z',
  revoked_at: null,
  status: 'active',
  created_at: '2026-05-03T00:00:00.000Z',
  updated_at: '2026-05-03T00:00:00.000Z',
}

describe('LeadIdentityService', () => {
  it('issues a chapter member identity for an approved membership and marks it primary', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.chapter_membership._builder._setThenValue({
      data: { user_id: 'user-1', chapter_id: 'leaduni', status: 'approved' },
      error: null,
    })
    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: activeIdentity, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: activeIdentity, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })

    const result = await LeadIdentityService.issueForApprovedMembership(mockSupabase, {
      userId: 'user-1',
      chapterId: 'leaduni',
      issuedById: 'admin-1',
      makePrimary: true,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.identity.identity_type).toBe('chapter_member')
      expect(result.identity.is_primary).toBe(true)
    }
    expect(tableMocks.lead_identity.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        identity_type: 'chapter_member',
        chapter_id: 'leaduni',
        is_primary: false,
        status: 'active',
      })
    )
  })

  it('requires chapter-scoped identities to include a chapter', async () => {
    const { mockSupabase } = buildMockSupabase()

    const result = await LeadIdentityService.issueIdentity(mockSupabase, {
      userId: 'user-1',
      identityType: 'chapter_editor',
    })

    expect(result).toEqual({
      success: false,
      error: 'chapter_editor identities require a chapter.',
    })
  })

  it('rejects admin as a public identity type', async () => {
    const { mockSupabase } = buildMockSupabase()

    const result = await LeadIdentityService.issueIdentity(mockSupabase, {
      userId: 'user-1',
      identityType: 'admin',
    })

    expect(result).toEqual({
      success: false,
      error: 'Admin is an authorization role, not a public LEAD identity.',
    })
  })

  it('issues founder and staff identities without chapter scope', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const founderIdentity = { ...activeIdentity, identity_type: 'founder', chapter_id: null }

    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: founderIdentity, error: null })

    const result = await LeadIdentityService.issueIdentity(mockSupabase, {
      userId: 'user-1',
      identityType: 'founder',
      issuedById: 'admin-1',
    })

    expect(result.success).toBe(true)
    expect(tableMocks.lead_identity.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        identity_type: 'founder',
        chapter_id: null,
      })
    )
  })

  it('reactivates a revoked matching identity instead of inserting a duplicate', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const revokedIdentity = { ...activeIdentity, status: 'revoked', revoked_at: '2026-05-01T00:00:00.000Z' }

    tableMocks.lead_identity._builder._setThenValue({ data: revokedIdentity, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: { ...revokedIdentity, status: 'active', revoked_at: null }, error: null })

    const result = await LeadIdentityService.issueIdentity(mockSupabase, {
      userId: 'user-1',
      identityType: 'chapter_member',
      chapterId: 'leaduni',
      issuedById: 'admin-1',
    })

    expect(result.success).toBe(true)
    expect(tableMocks.lead_identity.insert).not.toHaveBeenCalled()
    expect(tableMocks.lead_identity.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', revoked_at: null })
    )
  })

  it('clears other active identities before setting a primary identity', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.lead_identity._builder._setThenValue({ data: activeIdentity, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })
    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })

    const result = await LeadIdentityService.setPrimaryIdentity(mockSupabase, {
      userId: 'user-1',
      identityId: 'identity-1',
    })

    expect(result.success).toBe(true)
    expect(tableMocks.lead_identity.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ is_primary: false })
    )
    expect(tableMocks.lead_identity.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ is_primary: true })
    )
  })

  it('uses deterministic fallback when no active primary exists', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    const memberIdentity = { ...activeIdentity, identity_type: 'chapter_member', is_primary: false }
    const editorIdentity = {
      ...activeIdentity,
      id: 'identity-2',
      identity_type: 'chapter_editor',
      is_primary: false,
      issued_at: '2026-05-02T00:00:00.000Z',
    }

    tableMocks.lead_identity._builder._setThenValue({ data: null, error: null })
    tableMocks.lead_identity._builder._setThenValue({
      data: [memberIdentity, editorIdentity],
      error: null,
    })

    const result = await LeadIdentityService.getPrimaryIdentity(mockSupabase, 'user-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.identity?.id).toBe('identity-2')
    }
  })
})
