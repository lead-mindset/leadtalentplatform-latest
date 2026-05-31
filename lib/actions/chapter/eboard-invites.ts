'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getApprovedChapterMembership, requireUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server-service'
import { ChapterEboardInviteService } from '@/lib/services/chapter-eboard-invite.service'
import { sendChapterEboardInviteEmail } from '@/lib/emails/send-email'
import {
  CHAPTER_FUNCTIONAL_AREAS,
  REGULAR_EBOARD_ROLE_LEVELS,
} from '@/lib/chapter-role-options'

type ActionResult =
  | { success: true; inviteId?: string; message?: string }
  | { success: false; error: string }

const CreateInviteSchema = z.object({
  email: z.string().trim().email(),
  roleLevel: z.enum(REGULAR_EBOARD_ROLE_LEVELS),
  functionalArea: z.enum(CHAPTER_FUNCTIONAL_AREAS),
  displayTitle: z.string().trim().min(2).max(120),
})

const InviteIdSchema = z.object({
  inviteId: z.string().uuid(),
})

function revalidateInvitePaths() {
  revalidatePath('/chapter/members')
  revalidatePath('/chapter')
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

async function getChapterContext() {
  const { supabase, user } = await requireUser()
  const membership = await getApprovedChapterMembership(supabase, user.id)
  if (!membership?.chapter_id) {
    return { success: false as const, error: 'No approved chapter membership found.' }
  }

  return { success: true as const, user, chapterId: membership.chapter_id }
}

export async function createChapterEboardInvite(input: unknown): Promise<ActionResult> {
  const parsed = CreateInviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid e-board invite.' }
  }

  const context = await getChapterContext()
  if (!context.success) return context

  const serviceSupabase = createServiceClient()
  const result = await ChapterEboardInviteService.createChapterEboardInvite(serviceSupabase, {
    actorUserId: context.user.id,
    chapterId: context.chapterId,
    email: parsed.data.email,
    roleLevel: parsed.data.roleLevel,
    functionalArea: parsed.data.functionalArea,
    displayTitle: parsed.data.displayTitle,
  })

  if (!result.success) return result

  try {
    const chapterName = await ChapterEboardInviteService.getChapterDisplayName(serviceSupabase, context.chapterId)
    const emailResult = await sendChapterEboardInviteEmail(result.invite.email, {
      chapterName,
      displayTitle: result.invite.display_title ?? parsed.data.displayTitle,
    })

    if (!emailResult.success) {
      throw new Error(emailResult.error)
    }
  } catch (error) {
    await ChapterEboardInviteService.revokeChapterEboardInviteAfterSendFailure(serviceSupabase, {
      actorUserId: context.user.id,
      chapterId: context.chapterId,
      inviteId: result.invite.id,
    })
    return { success: false, error: `Failed to send invite email: ${getErrorMessage(error)}` }
  }

  revalidateInvitePaths()
  return {
    success: true,
    inviteId: result.invite.id,
    message: 'Invite created successfully.',
  }
}

export async function cancelChapterEboardInvite(input: unknown): Promise<ActionResult> {
  const parsed = InviteIdSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid invite.' }
  }

  const context = await getChapterContext()
  if (!context.success) return context

  const serviceSupabase = createServiceClient()
  const result = await ChapterEboardInviteService.cancelChapterEboardInvite(serviceSupabase, {
    actorUserId: context.user.id,
    chapterId: context.chapterId,
    inviteId: parsed.data.inviteId,
  })

  if (!result.success) return result

  revalidateInvitePaths()
  return { success: true, message: 'Invite canceled.' }
}

export async function reinviteExpiredChapterEboardInvite(input: unknown): Promise<ActionResult> {
  const parsed = InviteIdSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid invite.' }
  }

  const context = await getChapterContext()
  if (!context.success) return context

  const serviceSupabase = createServiceClient()
  const result = await ChapterEboardInviteService.reinviteExpiredChapterEboardInvite(serviceSupabase, {
    actorUserId: context.user.id,
    chapterId: context.chapterId,
    inviteId: parsed.data.inviteId,
  })

  if (!result.success) return result

  try {
    const chapterName = await ChapterEboardInviteService.getChapterDisplayName(serviceSupabase, context.chapterId)
    const emailResult = await sendChapterEboardInviteEmail(result.invite.email, {
      chapterName,
      displayTitle: result.invite.display_title ?? 'E-board',
    })

    if (!emailResult.success) {
      throw new Error(emailResult.error)
    }
  } catch (error) {
    await ChapterEboardInviteService.revokeChapterEboardInviteAfterSendFailure(serviceSupabase, {
      actorUserId: context.user.id,
      chapterId: context.chapterId,
      inviteId: result.invite.id,
    })
    return { success: false, error: `Failed to send invite email: ${getErrorMessage(error)}` }
  }

  revalidateInvitePaths()
  return {
    success: true,
    inviteId: result.invite.id,
    message: 'Invite sent again.',
  }
}
