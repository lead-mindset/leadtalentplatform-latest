'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server-service'
import { ChapterInviteService } from '@/lib/services/chapter-invite.service'

type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

const AcceptInviteSchema = z.object({
  token: z.string().trim().min(16),
})

export async function acceptChapterInvite(input: unknown): Promise<ActionResult> {
  const parsed = AcceptInviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid invite token.' }
  }

  const { user } = await requireUser()
  const serviceSupabase = createServiceClient()
  const result = await ChapterInviteService.acceptInvite(serviceSupabase, {
    token: parsed.data.token,
    userId: user.id,
    email: user.email,
  })

  if (!result.success) return result

  revalidatePath('/chapter')
  revalidatePath('/chapter/members')

  return {
    success: true,
    message: result.accepted ? 'Invite accepted.' : 'Invite already accepted.',
  }
}
