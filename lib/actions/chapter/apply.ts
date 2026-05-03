'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service'

const ApplyToChapterSchema = z.object({
  chapterId: z.string().trim().min(1, 'Chapter is required'),
})

export async function applyToChapter(input: { chapterId: string }) {
  try {
    const parsed = ApplyToChapterSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid chapter application',
      }
    }

    const { supabase, user } = await requireUser()
    const result = await ChapterMembershipService.applyToChapter(supabase, {
      userId: user.id,
      chapterId: parsed.data.chapterId,
    })

    if (!result.success) {
      return result
    }

    revalidatePath('/student/profile')
    revalidatePath('/chapter')
    revalidatePath('/chapter/members')

    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}
