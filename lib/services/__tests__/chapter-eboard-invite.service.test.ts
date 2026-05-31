import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterInviteService } from '@/lib/services/chapter-invite.service'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { ChapterEboardInviteService } from '../chapter-eboard-invite.service'

vi.mock('@/lib/services/chapter-invite.service', () => ({
  ChapterInviteService: {
    createInvite: vi.fn(),
    listChapterInvites: vi.fn(),
    normalizeInviteEmail: vi.fn((email: string) => email.trim().toLowerCase()),
    reinviteExpiredInvite: vi.fn(),
    revokeInvite: vi.fn(),
  },
}))

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    hasChapterPermission: vi.fn(),
  },
}))

function invite(overrides: Record<string, unknown> = {}) {
  return {
    accepted_at: null,
    accepted_by_user_id: null,
    chapter_id: 'leaduni',
    created_at: '2026-05-31T00:00:00.000Z',
    created_by_role: 'chapter_leader',
    created_by_user_id: 'president-1',
    display_title: 'Directora de Eventos',
    email: 'leader@example.edu',
    expires_at: '2099-12-31T00:00:00.000Z',
    functional_area: 'events_experience',
    id: 'invite-1',
    invite_type: 'regular_eboard',
    raw_title: 'Directora de Eventos',
    role_level: 'director',
    status: 'pending',
    ...overrides,
  }
}

describe('ChapterEboardInviteService', () => {
  const mockSupabase = {} as SupabaseClient<Database>

  beforeEach(() => {
    vi.mocked(ChapterInviteService.createInvite).mockReset()
    vi.mocked(ChapterInviteService.listChapterInvites).mockReset()
    vi.mocked(ChapterInviteService.reinviteExpiredInvite).mockReset()
    vi.mocked(ChapterInviteService.revokeInvite).mockReset()
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockReset()
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(true)
  })

  it('creates a regular e-board chapter invite through the dedicated invite service', async () => {
    vi.mocked(ChapterInviteService.createInvite).mockResolvedValue({
      success: true,
      invite: invite(),
      token: 'token-123',
    })

    const result = await ChapterEboardInviteService.createChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: 'leader@example.edu',
      roleLevel: 'director',
      functionalArea: 'events_experience',
      displayTitle: 'Directora de Eventos',
    })

    expect(result.success).toBe(true)
    expect(ChapterInviteService.createInvite).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({
        actorUserId: 'president-1',
        chapterId: 'leaduni',
        email: 'leader@example.edu',
        inviteType: 'regular_eboard',
        roleLevel: 'director',
      })
    )
    if (result.success) expect(result.token).toBe('token-123')
  })

  it('rejects president and vice president invites from the chapter e-board wrapper', async () => {
    const result = await ChapterEboardInviteService.createChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      email: 'vp@example.edu',
      roleLevel: 'vice_president',
      functionalArea: 'general_leadership',
      displayTitle: 'Vicepresidenta',
    })

    expect(result).toEqual({
      success: false,
      error: 'Chapter leaders can only invite regular e-board roles.',
    })
    expect(ChapterInviteService.createInvite).not.toHaveBeenCalled()
  })

  it('lists only regular e-board invites and maps pending expired rows to UI statuses', async () => {
    vi.mocked(ChapterInviteService.listChapterInvites).mockResolvedValue({
      success: true,
      invites: [
        invite({ id: 'active-1', status: 'pending' }),
        invite({ id: 'expired-1', status: 'expired' }),
      ],
    })

    const result = await ChapterEboardInviteService.listChapterEboardInvites(mockSupabase, 'leaduni')

    expect(ChapterInviteService.listChapterInvites).toHaveBeenCalledWith(mockSupabase, {
      chapterId: 'leaduni',
      inviteTypes: ['regular_eboard'],
    })
    expect(result).toEqual({
      success: true,
      invites: [
        expect.objectContaining({ id: 'active-1', status: 'active' }),
        expect.objectContaining({ id: 'expired-1', status: 'expired' }),
      ],
    })
  })

  it('requires chapter e-board permission before canceling an invite', async () => {
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)

    const result = await ChapterEboardInviteService.cancelChapterEboardInvite(mockSupabase, {
      actorUserId: 'member-1',
      chapterId: 'leaduni',
      inviteId: 'invite-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'You do not have permission to manage e-board invites for this chapter.',
    })
    expect(ChapterInviteService.revokeInvite).not.toHaveBeenCalled()
  })

  it('reinvites expired e-board invites through the dedicated invite service', async () => {
    vi.mocked(ChapterInviteService.listChapterInvites).mockResolvedValue({
      success: true,
      invites: [invite({ status: 'expired' })],
    })
    vi.mocked(ChapterInviteService.reinviteExpiredInvite).mockResolvedValue({
      success: true,
      invite: invite({ id: 'invite-2', status: 'pending' }),
      token: 'token-456',
    })

    const result = await ChapterEboardInviteService.reinviteExpiredChapterEboardInvite(mockSupabase, {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      inviteId: 'invite-1',
    })

    expect(result.success).toBe(true)
    expect(ChapterInviteService.reinviteExpiredInvite).toHaveBeenCalledWith(mockSupabase, {
      actorUserId: 'president-1',
      inviteId: 'invite-1',
    })
    if (result.success) expect(result.token).toBe('token-456')
  })
})
