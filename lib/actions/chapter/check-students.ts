'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { ChapterService } from '@/lib/services/chapter.service'
import { sendMemberApprovalEmail } from '@/lib/emails/send-email'

// ───────────────────────────────────────────────────────────────
// Zod schemas (input validation at the controller boundary)
// ───────────────────────────────────────────────────────────────

const UserIdSchema = z.string().trim().min(1, 'User ID is required')
const UserIdsSchema = z.array(UserIdSchema).min(1, 'At least one member is required')

// ───────────────────────────────────────────────────────────────
// Auth helper (thin — delegates to requireUser, adds chapter guard)
// ───────────────────────────────────────────────────────────────

async function assertCanManageMember(
  targetUserId?: string
): Promise<
  | { success: true; supabase: Awaited<ReturnType<typeof requireUser>>['supabase']; user: Awaited<ReturnType<typeof requireUser>>['user']; chapterId: string | null }
  | { success: false; error: string }
> {
  const { supabase, user } = await requireUser()

  if (user.role !== 'admin' && user.role !== 'editor') {
    return { success: false, error: 'Only admins and editors can manage members' }
  }

  let chapterId: string | null = null

  if (user.role === 'editor') {
    const { data: profile } = await supabase
      .from('student_profile')
      .select('chapter_id')
      .eq('user_id', user.id)
      .single()

    chapterId = profile?.chapter_id ?? null
    if (!chapterId) {
      return { success: false, error: 'No chapter assigned' }
    }

    // If a specific target user is provided, verify they're in the editor's chapter
    if (targetUserId) {
      const { data: targetProfile } = await supabase
        .from('student_profile')
        .select('chapter_id')
        .eq('user_id', targetUserId)
        .single()

      if (!targetProfile || targetProfile.chapter_id !== chapterId) {
        return { success: false, error: 'Member not in your chapter' }
      }
    }
  }

  return { success: true, supabase, user, chapterId }
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
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid user ID' }
    }

    const auth = await assertCanManageMember(parsed.data)
    if (!auth.success) return auth

    const result = await ChapterService.approveMember(auth.supabase, parsed.data, auth.user.id)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidateMemberPaths(parsed.data)

    // Send approval email (fire-and-forget)
    const [{ data: userData }, { data: chapterData }] = await Promise.all([
      auth.supabase.from('user').select('email, name').eq('id', parsed.data).single(),
      auth.supabase.from('chapter').select('name').eq('id', auth.chapterId ?? '').single(),
    ])

    if (userData?.email && chapterData?.name) {
      sendMemberApprovalEmail(
        userData.email,
        userData.name || userData.email.split('@')[0],
        result.member_id,
        chapterData.name
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
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid member list' }
    }

    const auth = await assertCanManageMember()
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
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid user ID' }
    }

    const auth = await assertCanManageMember(parsed.data)
    if (!auth.success) return auth

    const result = await ChapterService.rejectMember(auth.supabase, parsed.data)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidateMemberPaths(parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function revokeApproval(user_id: string) {
  try {
    const parsed = UserIdSchema.safeParse(user_id)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid user ID' }
    }

    const auth = await assertCanManageMember(parsed.data)
    if (!auth.success) return auth

    const result = await ChapterService.revokeApproval(auth.supabase, parsed.data)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidateMemberPaths(parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}
