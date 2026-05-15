import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  COMPANY_ACCESS_HELP_PATH,
  canUserAccessChapter,
  canUserManageEvent,
  getApprovedChapterMembership,
  resolveRecruiterAccess,
} from './auth'
import type { UserRow } from './types'

type TableMock = {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
}

function buildMockSupabase(overrides: Partial<Record<string, Partial<TableMock>>> = {}) {
  const tableMocks: Record<string, TableMock> = {
    chapter_membership: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
    event: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
    event_chapter: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
    recruiter_access: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
  }

  for (const [table, override] of Object.entries(overrides)) {
    tableMocks[table] = {
      ...tableMocks[table],
      ...override,
    } as TableMock
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

function user(role: UserRow['role'], id = `${role}-1`): UserRow {
  return {
    id,
    email: `${id}@test.com`,
    name: id,
    role,
    phone: null,
    created_at: '2026-05-03T00:00:00.000Z',
    updated_at: '2026-05-03T00:00:00.000Z',
    deactivated_at: null,
  }
}

describe('auth chapter and event access helpers', () => {
  it('returns approved chapter membership details for a user', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_membership.maybeSingle.mockResolvedValue({
      data: { chapter_id: 'leaduni', position: 'editor', member_id: 'LEAD-123456' },
      error: null,
    })

    const result = await getApprovedChapterMembership(mockSupabase, 'editor-1')

    expect(result).toEqual({
      chapter_id: 'leaduni',
      position: 'editor',
      member_id: 'LEAD-123456',
    })
    expect(tableMocks.chapter_membership.eq).toHaveBeenCalledWith('status', 'approved')
  })

  it('allows admins to manage any event without chapter membership', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.event.maybeSingle.mockResolvedValue({
      data: { id: 'event-1', chapter_id: 'leaduni', capacity: 20, title: 'Demo', access_model: 'open' },
      error: null,
    })

    const result = await canUserManageEvent(mockSupabase, user('admin'), 'event-1')

    expect(result).toEqual({
      allowed: true,
      chapter_id: null,
      event: { id: 'event-1', chapter_id: 'leaduni', capacity: 20, title: 'Demo', access_model: 'open' },
    })
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
  })

  it('allows editors to manage events owned by their approved chapter', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.event.maybeSingle.mockResolvedValue({
      data: { id: 'event-1', chapter_id: 'leaduni', capacity: 20, title: 'Demo', access_model: 'open' },
      error: null,
    })
    tableMocks.chapter_membership.maybeSingle.mockResolvedValue({
      data: { chapter_id: 'leaduni', position: 'editor', member_id: 'LEAD-123456' },
      error: null,
    })

    const result = await canUserManageEvent(mockSupabase, user('editor'), 'event-1')

    expect(result).toMatchObject({
      allowed: true,
      chapter_id: 'leaduni',
    })
    expect(mockSupabase.from).not.toHaveBeenCalledWith('event_chapter')
  })

  it('allows editors to manage events where their approved chapter collaborates', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.event.maybeSingle.mockResolvedValue({
      data: { id: 'event-1', chapter_id: 'leadpucp', capacity: 20, title: 'Demo', access_model: 'open' },
      error: null,
    })
    tableMocks.chapter_membership.maybeSingle.mockResolvedValue({
      data: { chapter_id: 'leaduni', position: 'editor', member_id: 'LEAD-123456' },
      error: null,
    })
    tableMocks.event_chapter.maybeSingle.mockResolvedValue({
      data: { id: 'collab-1' },
      error: null,
    })

    const result = await canUserManageEvent(mockSupabase, user('editor'), 'event-1')

    expect(result).toMatchObject({
      allowed: true,
      chapter_id: 'leaduni',
    })
    expect(tableMocks.event_chapter.eq).toHaveBeenCalledWith('chapter_id', 'leaduni')
  })

  it('denies non-editors from managing events', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.event.maybeSingle.mockResolvedValue({
      data: { id: 'event-1', chapter_id: 'leaduni', capacity: 20, title: 'Demo', access_model: 'open' },
      error: null,
    })

    const result = await canUserManageEvent(mockSupabase, user('member'), 'event-1')

    expect(result).toMatchObject({
      allowed: false,
      error: 'Insufficient permissions',
    })
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
  })

  it('denies editors for other-chapter events without collaboration', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.event.maybeSingle.mockResolvedValue({
      data: { id: 'event-1', chapter_id: 'leadpucp', capacity: 20, title: 'Demo', access_model: 'open' },
      error: null,
    })
    tableMocks.chapter_membership.maybeSingle.mockResolvedValue({
      data: { chapter_id: 'leaduni', position: 'editor', member_id: 'LEAD-123456' },
      error: null,
    })
    tableMocks.event_chapter.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await canUserManageEvent(mockSupabase, user('editor'), 'event-1')

    expect(result).toMatchObject({
      allowed: false,
      error: 'Insufficient permissions',
    })
  })

  it('allows chapter access for an editor in their approved chapter', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_membership.maybeSingle.mockResolvedValue({
      data: { chapter_id: 'leaduni', position: 'editor', member_id: 'LEAD-123456' },
      error: null,
    })

    const result = await canUserAccessChapter(mockSupabase, user('editor'), 'leaduni')

    expect(result).toBe(true)
    expect(mockSupabase.from).not.toHaveBeenCalledWith('event_chapter')
  })

  it('allows chapter access for an editor when their chapter collaborates on the event', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_membership.maybeSingle.mockResolvedValue({
      data: { chapter_id: 'leaduni', position: 'editor', member_id: 'LEAD-123456' },
      error: null,
    })
    tableMocks.event_chapter.maybeSingle.mockResolvedValue({
      data: { id: 'collab-1' },
      error: null,
    })

    const result = await canUserAccessChapter(mockSupabase, user('editor'), 'leadpucp', 'event-1')

    expect(result).toBe(true)
    expect(tableMocks.event_chapter.eq).toHaveBeenCalledWith('event_id', 'event-1')
    expect(tableMocks.event_chapter.eq).toHaveBeenCalledWith('chapter_id', 'leaduni')
  })

  it('denies chapter access for unrelated editors without event collaboration', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.chapter_membership.maybeSingle.mockResolvedValue({
      data: { chapter_id: 'leaduni', position: 'editor', member_id: 'LEAD-123456' },
      error: null,
    })
    tableMocks.event_chapter.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await canUserAccessChapter(mockSupabase, user('editor'), 'leadpucp', 'event-1')

    expect(result).toBe(false)
  })

  it('denies chapter access for non-editors', async () => {
    const { mockSupabase } = buildMockSupabase()

    const result = await canUserAccessChapter(mockSupabase, user('member'), 'leaduni', 'event-1')

    expect(result).toBe(false)
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
  })
})

describe('auth recruiter access helpers', () => {
  it('uses a company access help path for signed-in representatives without active access', () => {
    expect(COMPANY_ACCESS_HELP_PATH).toBe('/company/onboard?access=missing')
  })

  it('resolves active accepted recruiter access without profile or membership tables', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.recruiter_access.maybeSingle.mockResolvedValue({
      data: {
        id: 'access-1',
        company_id: 'company-1',
        is_active: true,
        granted_by_id: 'admin-1',
        accepted_by_user_id: 'recruiter-1',
        granted_at: '2026-05-03T00:00:00.000Z',
        accepted_at: '2026-05-03T00:00:00.000Z',
        revoked_at: null,
        invite_expires_at: null,
        recruiter_email: 'recruiter@test.com',
        invite_token: 'token-1',
        revoked_by_id: null,
        Company: [{ id: 'company-1', name: 'Acme', created_at: '2026-05-03T00:00:00.000Z', created_by_id: 'admin-1' }],
      },
      error: null,
    })

    const result = await resolveRecruiterAccess(mockSupabase, 'recruiter-1')

    expect(result).toMatchObject({
      allowed: true,
      company: { id: 'company-1', name: 'Acme' },
    })
    expect(mockSupabase.from).not.toHaveBeenCalledWith('person_profile')
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
  })

  it('denies missing recruiter access', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.recruiter_access.maybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await resolveRecruiterAccess(mockSupabase, 'recruiter-1')

    expect(result).toEqual({ allowed: false, reason: 'missing' })
  })

  it('denies revoked recruiter access', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.recruiter_access.maybeSingle.mockResolvedValue({
      data: {
        id: 'access-1',
        is_active: true,
        revoked_at: '2026-05-03T00:00:00.000Z',
        Company: [],
      },
      error: null,
    })

    const result = await resolveRecruiterAccess(mockSupabase, 'recruiter-1')

    expect(result).toEqual({ allowed: false, reason: 'revoked' })
  })

  it('denies inactive recruiter access', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.recruiter_access.maybeSingle.mockResolvedValue({
      data: {
        id: 'access-1',
        is_active: false,
        revoked_at: null,
        Company: [],
      },
      error: null,
    })

    const result = await resolveRecruiterAccess(mockSupabase, 'recruiter-1')

    expect(result).toEqual({ allowed: false, reason: 'inactive' })
  })

  it('denies expired recruiter access', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.recruiter_access.maybeSingle.mockResolvedValue({
      data: {
        id: 'access-1',
        is_active: true,
        revoked_at: null,
        invite_expires_at: '2026-01-01T00:00:00.000Z',
        Company: [],
      },
      error: null,
    })

    const result = await resolveRecruiterAccess(mockSupabase, 'recruiter-1')

    expect(result).toEqual({ allowed: false, reason: 'expired' })
  })

  it('denies recruiter access when the access query fails', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()
    tableMocks.recruiter_access.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    })

    const result = await resolveRecruiterAccess(mockSupabase, 'recruiter-1')

    expect(result).toEqual({ allowed: false, reason: 'error' })
  })
})
