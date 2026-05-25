'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getApprovedChapterMembership, requireUser } from '@/lib/auth'
import { ChapterService } from '@/lib/services/chapter.service'
import {
  ChapterPermissionService,
  type ChapterPermissionKey,
} from '@/lib/services/chapter-permission.service'
import { sendMemberApprovalEmail } from '@/lib/emails/send-email'

// ───────────────────────────────────────────────────────────────
// Zod schemas (input validation at the controller boundary)
// ───────────────────────────────────────────────────────────────

const UserIdSchema = z.string().trim().min(1, 'User ID is required')
const UserIdsSchema = z.array(UserIdSchema).min(1, 'At least one member is required')
const RevokeReasonSchema = z.string().trim().min(1, 'A revocation reason is required.')

// ───────────────────────────────────────────────────────────────
// Auth helper (thin — delegates to requireUser, adds chapter guard)
// ───────────────────────────────────────────────────────────────

async function assertCanManageMember(
  targetUserId: string | undefined,
  permissionKey: ChapterPermissionKey,
  targetStatus: 'pending' | 'approved' = 'pending'
): Promise<
  | { success: true; supabase: Awaited<ReturnType<typeof requireUser>>['supabase']; user: Awaited<ReturnType<typeof requireUser>>['user']; chapterId: string | null; targetChapterId: string | null }
  | { success: false; error: string }
> {
  const { supabase, user } = await requireUser()

  let chapterId: string | null = null
  let targetChapterId: string | null = null

  if (user.role === 'admin') {
    if (targetUserId) {
      targetChapterId = targetStatus === 'approved'
        ? await ChapterService.getStudentChapterId(supabase, targetUserId)
        : await ChapterService.getPendingMembershipChapterId(supabase, targetUserId)
    }
  } else {
    const membership = await getApprovedChapterMembership(supabase, user.id)
    chapterId = membership?.chapter_id ?? null
    if (!chapterId) {
      return { success: false, error: 'No chapter assigned' }
    }

    const hasPermission = await ChapterPermissionService.hasChapterPermission(supabase, {
      userId: user.id,
      chapterId,
      permissionKey,
    })

    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to manage this member workflow.' }
    }

    if (targetUserId) {
      targetChapterId = chapterId
    }
  }

  if (targetUserId && !targetChapterId) {
    return { success: false, error: 'Membership application not found.' }
  }

  return { success: true, supabase, user, chapterId, targetChapterId }
}

function revalidateMemberPaths(userId: string) {
  revalidatePath('/chapter/members')
  revalidatePath('/chapter')
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/chapters')
}

// ───────────────────────────────────────────────────────────────
// Actions (thin controllers: auth + Zod validation + service call + revalidate)
// ───────────────────────────────────────────────────────────────

export async function approveMember(user_id: string) {
  try {
    const parsed = UserIdSchema.safeParse(user_id)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid user ID' }
    }

    const auth = await assertCanManageMember(parsed.data, 'chapter.members.manage_applications')
    if (!auth.success) return auth

    const result = await ChapterService.approveMember(
      auth.supabase,
      parsed.data,
      auth.user.id,
      auth.targetChapterId
    )
    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidateMemberPaths(parsed.data)

    // Send approval email (fire-and-forget)
    const [userData, chapterName] = await Promise.all([
      ChapterService.getUserBasicInfo(auth.supabase, parsed.data),
      auth.targetChapterId ? ChapterService.getChapterName(auth.supabase, auth.targetChapterId) : Promise.resolve(null),
    ])

    if (userData?.email && chapterName) {
      sendMemberApprovalEmail(
        userData.email,
        userData.name || userData.email.split('@')[0],
        result.member_id,
        chapterName
      ).catch(() => {})
    }

    return { success: true, member_id: result.member_id }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function approveMembersBulk(user_ids: string[]) {
  try {
    const parsed = UserIdsSchema.safeParse(user_ids)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid member list' }
    }

    const auth = await assertCanManageMember(undefined, 'chapter.members.manage_applications')
    if (!auth.success) return auth

    const result = await ChapterService.approveMembersBulk(
      auth.supabase,
      parsed.data,
      auth.user.id,
      auth.chapterId
    )

    // Revalidate for all approved members
    for (const userId of parsed.data) {
      revalidateMemberPaths(userId)
    }

    return result
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rejectMember(user_id: string, _reason?: string) {
  try {
    void _reason // reserved for future use (audit trail)

    const parsed = UserIdSchema.safeParse(user_id)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid user ID' }
    }

    const auth = await assertCanManageMember(parsed.data, 'chapter.members.manage_applications')
    if (!auth.success) return auth

    const result = await ChapterService.rejectMember(
      auth.supabase,
      parsed.data,
      auth.user.id,
      auth.targetChapterId
    )
    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidateMemberPaths(parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function revokeApproval(user_id: string, reason: string) {
  try {
    const parsed = UserIdSchema.safeParse(user_id)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid user ID' }
    }

    const parsedReason = RevokeReasonSchema.safeParse(reason)
    if (!parsedReason.success) {
      return { success: false, error: parsedReason.error.issues[0]?.message ?? 'A revocation reason is required.' }
    }

    const auth = await assertCanManageMember(parsed.data, 'chapter.members.revoke', 'approved')
    if (!auth.success) return auth

    const result = await ChapterService.revokeApproval(
      auth.supabase,
      parsed.data,
      auth.user.id,
      auth.targetChapterId,
      parsedReason.data
    )
    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidateMemberPaths(parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}
