import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import {
  AUTH_UNAUTHORIZED_PATH,
  getRoleDefaultWorkspacePath,
  getPostAuthRedirectPath,
  getSignedInUnauthorizedRedirectPath,
  getStudentWorkspaceRedirectPath,
  resolvePostAuthRedirectPath,
} from './auth-redirects'

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

describe('getStudentWorkspaceRedirectPath', () => {
  it('redirects workspace-specific roles away from the student area', () => {
    expect(getStudentWorkspaceRedirectPath('recruiter')).toBe('/company')
    expect(getStudentWorkspaceRedirectPath('admin')).toBe('/admin')
  })

  it('allows student and chapter-operator account lanes into the student area', () => {
    expect(getStudentWorkspaceRedirectPath('member')).toBeNull()
    expect(getStudentWorkspaceRedirectPath('editor')).toBeNull()
    expect(getStudentWorkspaceRedirectPath(null)).toBeNull()
  })

  it('fails closed for unknown non-empty roles', () => {
    expect(getStudentWorkspaceRedirectPath('unknown' as never)).toBe('/auth/error')
  })
})

describe('signed-in unauthorized redirects', () => {
  it('keeps signed-in users out of login when they lack access', () => {
    expect(getSignedInUnauthorizedRedirectPath('member', 'admin')).toBe(
      `${AUTH_UNAUTHORIZED_PATH}?next=%2Fstudent&reason=admin`
    )
    expect(getSignedInUnauthorizedRedirectPath('admin', 'chapter')).toBe(
      `${AUTH_UNAUTHORIZED_PATH}?next=%2Fadmin&reason=chapter`
    )
    expect(getSignedInUnauthorizedRedirectPath('recruiter', 'chapter')).toBe(
      `${AUTH_UNAUTHORIZED_PATH}?next=%2Fcompany&reason=chapter`
    )
  })

  it('resolves default workspaces by role', () => {
    expect(getRoleDefaultWorkspacePath('admin')).toBe('/admin')
    expect(getRoleDefaultWorkspacePath('recruiter')).toBe('/company')
    expect(getRoleDefaultWorkspacePath('member')).toBe('/student')
    expect(getRoleDefaultWorkspacePath('editor')).toBe('/student')
    expect(getRoleDefaultWorkspacePath(null)).toBe('/student')
  })
})
