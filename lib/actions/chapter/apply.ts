'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service'
import { ChapterService } from '@/lib/services/chapter.service'
import { sendChapterApplicationSubmittedEmail } from '@/lib/emails/send-email'

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

    const chapterName = await ChapterService.getChapterName(supabase, parsed.data.chapterId)
    if (chapterName && user.email) {
      void sendChapterApplicationSubmittedEmail(
        user.email,
        user.name || user.email.split('@')[0],
        chapterName
      ).catch((error: Error) => console.error('Failed to send chapter application email:', error))
    }

    revalidatePath('/student')
    revalidatePath('/student/profile')
    revalidatePath('/chapter')
    revalidatePath('/chapter/members')

    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}
