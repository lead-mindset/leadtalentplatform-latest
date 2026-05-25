import { beforeEach, describe, expect, it, vi } from 'vitest'
import { approveMember, revokeApproval } from '../check-students'
import { getApprovedChapterMembership, requireUser } from '@/lib/auth'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { ChapterService } from '@/lib/services/chapter.service'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn(),
  getApprovedChapterMembership: vi.fn(),
}))

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    hasChapterPermission: vi.fn(),
  },
}))

vi.mock('@/lib/services/chapter.service', () => ({
  ChapterService: {
    approveMember: vi.fn(),
    revokeApproval: vi.fn(),
    getPendingMembershipChapterId: vi.fn(),
    getStudentChapterId: vi.fn(),
    getUserBasicInfo: vi.fn(),
    getChapterName: vi.fn(),
  },
}))

vi.mock('@/lib/emails/send-email', () => ({
  sendMemberApprovalEmail: vi.fn(),
}))

const mockSupabase = { from: vi.fn() }

describe('chapter member server action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireUser).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'member-1', role: 'member', email: 'member@test.com' },
    } as never)
    vi.mocked(getApprovedChapterMembership).mockResolvedValue({ chapter_id: 'leaduni' } as never)
    vi.mocked(ChapterPermissionService.hasChapterPermission).mockResolvedValue(false)
  })

  it('rejects direct member approval without manage-application permission', async () => {
    const result = await approveMember('target-1')

    expect(result).toEqual({
      success: false,
      error: 'You do not have permission to manage this member workflow.',
    })
    expect(ChapterPermissionService.hasChapterPermission).toHaveBeenCalledWith(mockSupabase, {
      userId: 'member-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.members.manage_applications',
    })
    expect(ChapterService.approveMember).not.toHaveBeenCalled()
  })

  it('rejects direct membership revocation without revoke permission', async () => {
    const result = await revokeApproval('target-1', 'No longer active')

    expect(result).toEqual({
      success: false,
      error: 'You do not have permission to manage this member workflow.',
    })
    expect(ChapterPermissionService.hasChapterPermission).toHaveBeenCalledWith(mockSupabase, {
      userId: 'member-1',
      chapterId: 'leaduni',
      permissionKey: 'chapter.members.revoke',
    })
    expect(ChapterService.revokeApproval).not.toHaveBeenCalled()
  })
})
