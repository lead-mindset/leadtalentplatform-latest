import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { getPostAuthRedirectPath, resolvePostAuthRedirectPath } from './auth-redirects'

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    hasChapterPermission: vi.fn(),
  },
}))

function buildRedirectSupabase(membership: { chapter_id: string } | null) {
  const chapterMembership = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: membership, error: null }),
  }

  const supabase = {
    from: vi.fn().mockReturnValue(chapterMembership),
  } as unknown as SupabaseClient<Database>

  return { supabase, chapterMembership }
}

describe('getPostAuthRedirectPath', () => {
  beforeEach(() => {
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockReset()
  })

  it('sends member and editor users with profiles to the student dashboard', () => {
    expect(getPostAuthRedirectPath({ role: 'member', hasProfile: true })).toBe('/student')
    expect(getPostAuthRedirectPath({ role: 'editor', hasProfile: true })).toBe('/student')
  })

  it('sends profiled chapter operators with dashboard permission to chapter operations', () => {
    expect(
      getPostAuthRedirectPath({
        role: 'member',
        hasProfile: true,
        hasChapterDashboardAccess: true,
      })
    ).toBe('/chapter')
  })

  it('sends member and editor users without profiles to onboarding', () => {
    expect(getPostAuthRedirectPath({ role: 'member', hasProfile: false })).toBe('/onboarding')
    expect(getPostAuthRedirectPath({ role: 'editor', hasProfile: false })).toBe('/onboarding')
  })

  it('sends workspace roles to their role-specific dashboard', () => {
    expect(getPostAuthRedirectPath({ role: 'admin', hasProfile: false })).toBe('/admin')
    expect(getPostAuthRedirectPath({ role: 'recruiter', hasProfile: false })).toBe('/company')
  })

  it('falls back safely for missing or unknown roles', () => {
    expect(getPostAuthRedirectPath({ role: null, hasProfile: false })).toBe('/onboarding')
    expect(getPostAuthRedirectPath({ role: 'unknown' as never, hasProfile: true })).toBe('/auth/error')
  })

  it('resolves permitted member-role e-board users to the chapter dashboard', async () => {
    const { supabase } = buildRedirectSupabase({ chapter_id: 'leaduni' })
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(true)

    const result = await resolvePostAuthRedirectPath(supabase, {
      userId: 'member-1',
      role: 'member',
      hasProfile: true,
    })

    expect(result).toBe('/chapter')
    expect(ChapterPermissionService.hasChapterPermission).toHaveBeenCalledWith(supabase, {
      userId: 'member-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.dashboard.access',
    })
  })

  it('resolves regular approved members without dashboard permission to student', async () => {
    const { supabase } = buildRedirectSupabase({ chapter_id: 'leaduni' })
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)

    const result = await resolvePostAuthRedirectPath(supabase, {
      userId: 'member-1',
      role: 'member',
      hasProfile: true,
    })

    expect(result).toBe('/student')
  })

  it('keeps recruiter redirects role-based without chapter permission checks', async () => {
    const { supabase } = buildRedirectSupabase({ chapter_id: 'leaduni' })

    const result = await resolvePostAuthRedirectPath(supabase, {
      userId: 'recruiter-1',
      role: 'recruiter',
      hasProfile: true,
    })

    expect(result).toBe('/company')
    expect(ChapterPermissionService.hasChapterPermission).not.toHaveBeenCalled()
  })
})
