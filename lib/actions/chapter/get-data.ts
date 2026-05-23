import { ChapterService } from '@/lib/services/chapter.service'
import {
  filterChapterMembersForPermissions,
  getChapterMemberPermissionFlags,
  type ChapterMemberPermissionFlags,
} from '@/lib/services/chapter.service'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { getApprovedChapterMembership, requireUser } from '@/lib/auth'
import type { MemberWithProfile } from '@/lib/types'

type AuthorizedChapterRoster = {
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase']
  permissions: ChapterMemberPermissionFlags
}

async function authorizeChapterRosterRead(chapter_id: string): Promise<AuthorizedChapterRoster | null> {
  const { supabase, user } = await requireUser()

  if (user.role !== 'admin') {
    const membership = await getApprovedChapterMembership(supabase, user.id)
    if (membership?.chapter_id !== chapter_id) return null
  }

  const permissionKeys = await ChapterPermissionService.getChapterPermissionSet(supabase, {
    userId: user.id,
    chapterId: chapter_id,
  })
  const permissions = getChapterMemberPermissionFlags(permissionKeys)

  if (
    !permissions.canViewApproved &&
    !permissions.canViewAlumni &&
    !permissions.canViewApplicants &&
    !permissions.canViewRejected &&
    !permissions.canViewInactive
  ) {
    return null
  }

  return { supabase, permissions }
}

export async function getChapterMembers(
  chapter_id: string
): Promise<MemberWithProfile[]> {
  const auth = await authorizeChapterRosterRead(chapter_id)
  if (!auth) return []

  const members = await ChapterService.getChapterMembers(auth.supabase, chapter_id)
  return filterChapterMembersForPermissions(members, auth.permissions)
}

export async function getChapterMemberPermissions(
  chapter_id: string
): Promise<ChapterMemberPermissionFlags | null> {
  const auth = await authorizeChapterRosterRead(chapter_id)
  return auth?.permissions ?? null
}

export function getMemberStats(members: MemberWithProfile[]) {
  return ChapterService.getMemberStats(members)
}

export async function getRecentChapterActivity(
  chapter_id: string,
  limit: number = 5
): Promise<MemberWithProfile[]> {
  const auth = await authorizeChapterRosterRead(chapter_id)
  if (!auth?.permissions.canViewApproved) return []

  return ChapterService.getRecentChapterActivity(auth.supabase, chapter_id, limit)
}
