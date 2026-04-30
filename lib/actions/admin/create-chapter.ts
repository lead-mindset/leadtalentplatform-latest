'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { AdminService } from '@/lib/services/admin.service'
import { z } from 'zod'
import type { ChapterRow } from '@/lib/types'

const ChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID required"),
  name: z.string().min(1, "Chapter name required"),
  university: z.string().min(1, "University required"),
  city: z.string().optional(),
  region: z.string().optional(),
})

type CreateChapterInput = z.infer<typeof ChapterSchema>

type CreateChapterResponse = 
  | { success: true; chapter: ChapterRow }
  | { error: string }

type GetChaptersResponse = 
  | { chapters: ChapterRow[] }
  | { error: string }

export async function createChapter(formData: CreateChapterInput): Promise<CreateChapterResponse> {
  const { supabase } = await requireAdmin()

  const parsed = ChapterSchema.safeParse(formData)

  if (!parsed.success) {
    return {
      error: 'Validation failed',
    }
  }

  const { id, name, university, city, region } = parsed.data

  const result = await AdminService.createChapter(supabase, {
    id,
    name,
    university,
    city,
    region,
  })

  if (!result.success) {
    return { error: result.error }
  }

  revalidatePath('/admin/chapters')

  return {
    success: true,
    chapter: result.chapter,
  }
}

export async function getChapters(): Promise<GetChaptersResponse> {
  const { supabase } = await requireAdmin()

  const result = await AdminService.getAllChapters(supabase)
  if ('error' in result) {
    return { error: result.error }
  }

  return { chapters: result.chapters }
}
