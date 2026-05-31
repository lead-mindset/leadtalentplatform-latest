'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { CHAPTER_FUNCTIONAL_AREAS } from '@/lib/chapter-role-options'
import { sendChapterEboardInviteEmail } from '@/lib/emails/send-email'
import {
  ChapterProtectedLeadershipInviteService,
  type ActiveProtectedLeader,
  type ProtectedLeadershipInvite,
} from '@/lib/services/chapter-protected-leadership-invite.service'
import { createServiceClient } from '@/lib/supabase/server-service'

type ActionResult =
  | { success: true; inviteId?: string; message?: string }
  | { success: false; error: string }

const PROTECTED_ROLE_LEVELS = ['president', 'vice_president'] as const

const CreateProtectedInviteSchema = z.object({
  chapterId: z.string().trim().min(1),
  email: z.string().trim().email(),
  roleLevel: z.enum(PROTECTED_ROLE_LEVELS),
  functionalArea: z.enum(CHAPTER_FUNCTIONAL_AREAS),
  displayTitle: z.string().trim().min(2).max(120),
})

const InviteMutationSchema = z.object({
  chapterId: z.string().trim().min(1),
  inviteId: z.string().uuid(),
})

function revalidateChapterInvitePaths(chapterId: string) {
  revalidatePath(`/admin/chapters/${chapterId}`)
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

export async function getProtectedLeadershipInviteState(chapterId: string): Promise<{
  activeLeaders: ActiveProtectedLeader[]
  invites: ProtectedLeadershipInvite[]
}> {
  await requireAdmin()
  const result = await ChapterProtectedLeadershipInviteService.getInviteState(createServiceClient(), chapterId)
  if (!result.success) return { activeLeaders: [], invites: [] }
  return { activeLeaders: result.activeLeaders, invites: result.invites }
}

export async function createAdminProtectedLeadershipInvite(input: unknown): Promise<ActionResult> {
  const parsed = CreateProtectedInviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid protected leadership invite.' }
  }

  const { user } = await requireAdmin()
  const supabase = createServiceClient()
  const result = await ChapterProtectedLeadershipInviteService.createProtectedLeadershipInvite(supabase, {
    actorUserId: user.id,
    chapterId: parsed.data.chapterId,
    email: parsed.data.email,
    roleLevel: parsed.data.roleLevel,
    functionalArea: parsed.data.functionalArea,
    displayTitle: parsed.data.displayTitle,
  })

  if (!result.success) return result

  try {
    const chapterName = await ChapterProtectedLeadershipInviteService.getChapterName(supabase, parsed.data.chapterId)
    const emailResult = await sendChapterEboardInviteEmail(result.invite.email, {
      chapterName,
      displayTitle: result.invite.display_title,
      token: result.token,
    })

    if (!emailResult.success) throw new Error(emailResult.error)
  } catch (error) {
    await ChapterProtectedLeadershipInviteService.revokeProtectedLeadershipInvite(supabase, {
      actorUserId: user.id,
      chapterId: parsed.data.chapterId,
      inviteId: result.invite.id,
    })
    return { success: false, error: `Failed to send invite email: ${getErrorMessage(error)}` }
  }

  revalidateChapterInvitePaths(parsed.data.chapterId)
  return { success: true, inviteId: result.invite.id, message: 'Protected leadership invite sent.' }
}

export async function revokeAdminProtectedLeadershipInvite(input: unknown): Promise<ActionResult> {
  const parsed = InviteMutationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid invite.' }
  }

  const { user } = await requireAdmin()
  const result = await ChapterProtectedLeadershipInviteService.revokeProtectedLeadershipInvite(createServiceClient(), {
    actorUserId: user.id,
    chapterId: parsed.data.chapterId,
    inviteId: parsed.data.inviteId,
  })

  if (!result.success) return result
  revalidateChapterInvitePaths(parsed.data.chapterId)
  return { success: true, message: 'Protected leadership invite revoked.' }
}

export async function reinviteExpiredAdminProtectedLeadershipInvite(input: unknown): Promise<ActionResult> {
  const parsed = InviteMutationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid invite.' }
  }

  const { user } = await requireAdmin()
  const supabase = createServiceClient()
  const result = await ChapterProtectedLeadershipInviteService.reinviteExpiredProtectedLeadershipInvite(supabase, {
    actorUserId: user.id,
    chapterId: parsed.data.chapterId,
    inviteId: parsed.data.inviteId,
  })

  if (!result.success) return result

  try {
    const chapterName = await ChapterProtectedLeadershipInviteService.getChapterName(supabase, parsed.data.chapterId)
    const emailResult = await sendChapterEboardInviteEmail(result.invite.email, {
      chapterName,
      displayTitle: result.invite.display_title,
      token: result.token,
    })

    if (!emailResult.success) throw new Error(emailResult.error)
  } catch (error) {
    await ChapterProtectedLeadershipInviteService.revokeProtectedLeadershipInvite(supabase, {
      actorUserId: user.id,
      chapterId: parsed.data.chapterId,
      inviteId: result.invite.id,
    })
    return { success: false, error: `Failed to send invite email: ${getErrorMessage(error)}` }
  }

  revalidateChapterInvitePaths(parsed.data.chapterId)
  return { success: true, inviteId: result.invite.id, message: 'Protected leadership invite sent again.' }
}
