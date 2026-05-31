import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { ChapterEboardInviteService } from '../chapter-eboard-invite.service'

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
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
  gt: MockFn
  limit: MockFn
  order: MockFn
  single: MockFn
  maybeSingle: MockFn
  then: MockFn
  _setResult: (value: QueryResult) => void
}

type TableName = 'chapter_preapproval'

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
    is: vi.fn(() => builder),
    gt: vi.fn(() => builder),
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
    chapter_preapproval: createBuilder(),
  }

  const mockSupabase = {
    from: vi.fn((table: TableName) => tableMocks[table]),
  } as unknown as SupabaseClient<Database>

  return { mockSupabase, tableMocks }
}

function inviteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invite-1',
    email: 'Leader@Test.com',
    normalized_email: 'leader@test.com',
    chapter_id: 'leaduni',
    preapproval_type: 'eboard',
    role_level: 'director',
    functional_area: 'events_experience',
    display_title: 'Directora de Eventos',
    raw_title: 'Directora de Eventos',
    expires_at: '2099-12-31T00:00:00.000Z',
    consumed_at: null,
    consumed_by_user_id: null,
    revoked_at: null,
    revoked_by_id: null,
    created_by_id: 'president-1',
    source: 'chapter_leader_invite',
    notes: null,
    created_at: '2026-05-30T00:00:00.000Z',
    updated_at: '2026-05-30T00:00:00.000Z',
    ...overrides,
  }
}

describe('ChapterEboardInviteService', () => {
  beforeEach(() => {
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockReset()
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(true)
  })

  it('creates a 30-day e-board preapproval for an authorized chapter leader', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })
    tableMocks.chapter_preapproval._setResult({ data: inviteRow(), error: null })

    const result = await ChapterEboardInviteService.createChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: ' Leader@Test.com ',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Directora de Eventos',
    })

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        invite: expect.objectContaining({
          id: 'invite-1',
          email: 'Leader@Test.com',
          role_level: 'director',
          status: 'active',
        }),
      })
    )
    expect(ChapterPermissionService.hasChapterPermission).toHaveBeenCalledWith(mockSupabase, {
      userId: 'president-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.roles.assign_eboard',
    })
    expect(tableMocks.chapter_preapproval.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'Leader@Test.com',
        normalized_email: 'leader@test.com',
        chapter_id: 'leaduni',
        preapproval_type: 'eboard',
        role_level: 'director',
        functional_area: 'events_experience',
        display_title: 'Directora de Eventos',
        raw_title: 'Directora de Eventos',
        created_by_id: 'president-1',
        source: 'chapter_leader_invite',
      })
    )
  })

  it('rejects invite creation without e-board assignment permission', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)

    const result = await ChapterEboardInviteService.createChapterEboardInvite(mockSupabase, {
      actorUserId: 'member-1',
      chapterId: 'leaduni',
      email: 'member@test.com',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Directora de Eventos',
    })

    expect(result).toEqual({
      success: false,
      error: 'You do not have permission to invite e-board members for this chapter.',
    })
    expect(tableMocks.chapter_preapproval.insert).not.toHaveBeenCalled()
  })

  it('rejects protected president or vice president invites', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    const result = await ChapterEboardInviteService.createChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: 'vp@test.com',
      roleLevel: 'vice_president',
      functionalArea: 'general_leadership',
      displayTitle: 'Vicepresidenta',
    })

    expect(result).toEqual({
      success: false,
      error: 'Chapter leaders can only invite regular e-board roles.',
    })
    expect(tableMocks.chapter_preapproval.insert).not.toHaveBeenCalled()
  })

  it('rejects duplicate active unaccepted invites for the same email and chapter', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: { id: 'existing-invite' }, error: null })

    const result = await ChapterEboardInviteService.createChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: 'leader@test.com',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Directora de Eventos',
    })

    expect(result).toEqual({
      success: false,
      error: 'An active invite already exists for this email and chapter.',
    })
    expect(tableMocks.chapter_preapproval.insert).not.toHaveBeenCalled()
  })

  it('rejects fresh creation when an expired unaccepted invite should be re-invited instead', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({
      data: { id: 'expired-invite', expires_at: '2026-01-01T00:00:00.000Z' },
      error: null,
    })

    const result = await ChapterEboardInviteService.createChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: 'leader@test.com',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Directora de Eventos',
    })

    expect(result).toEqual({
      success: false,
      error: 'An expired invite already exists for this email. Use re-invite from the pending invite list.',
    })
    expect(tableMocks.chapter_preapproval.insert).not.toHaveBeenCalled()
  })

  it('cancels active unaccepted invites for the actor chapter', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({ data: inviteRow(), error: null })
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })

    const result = await ChapterEboardInviteService.cancelChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      inviteId: 'invite-1',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.chapter_preapproval.update).toHaveBeenCalledWith(
      expect.objectContaining({
        revoked_by_id: 'president-1',
        notes: 'Canceled by chapter leader before acceptance',
      })
    )
    expect(tableMocks.chapter_preapproval.eq).toHaveBeenCalledWith('id', 'invite-1')
  })

  it('re-invites expired unaccepted invites by revoking old invite and inserting a fresh one', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({
      data: inviteRow({ expires_at: '2026-01-01T00:00:00.000Z', notes: 'first invite' }),
      error: null,
    })
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })
    tableMocks.chapter_preapproval._setResult({ data: null, error: null })
    tableMocks.chapter_preapproval._setResult({ data: inviteRow({ id: 'invite-2' }), error: null })

    const result = await ChapterEboardInviteService.reinviteExpiredChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      inviteId: 'invite-1',
    })

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        invite: expect.objectContaining({ id: 'invite-2' }),
      })
    )
    expect(tableMocks.chapter_preapproval.update).toHaveBeenCalledWith(
      expect.objectContaining({
        revoked_by_id: 'president-1',
        notes: 'first invite | Re-invited by chapter leader after expiration',
      })
    )
    expect(tableMocks.chapter_preapproval.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'Leader@Test.com',
        normalized_email: 'leader@test.com',
        chapter_id: 'leaduni',
        source: 'chapter_leader_invite',
      })
    )
  })

  it('lists active and expired unaccepted chapter leader invites', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_preapproval._setResult({
      data: [
        inviteRow({ id: 'active', expires_at: '2099-12-31T00:00:00.000Z' }),
        inviteRow({ id: 'expired', expires_at: '2026-01-01T00:00:00.000Z' }),
      ],
      error: null,
    })

    const result = await ChapterEboardInviteService.listChapterEboardInvites(mockSupabase, 'leaduni')

    expect(result).toEqual({
      success: true,
      invites: [
        expect.objectContaining({ id: 'active', status: 'active' }),
        expect.objectContaining({ id: 'expired', status: 'expired' }),
      ],
    })
    expect(tableMocks.chapter_preapproval.eq).toHaveBeenCalledWith('chapter_id', 'leaduni')
    expect(tableMocks.chapter_preapproval.eq).toHaveBeenCalledWith('source', 'chapter_leader_invite')
  })
})
