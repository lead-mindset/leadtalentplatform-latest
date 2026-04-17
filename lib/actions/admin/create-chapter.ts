'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser, requireAdmin } from '@/lib/auth'
import type { ChapterRow } from '@/lib/types'

const ChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID required"),
  name: z.string().min(1, "Chapter name required"),
  university: z.string().min(1, "University required"),
  city: z.string().optional(),
  region: z.string().optional(),
})

const CHAPTER_SELECT = 'id, name, university, city, region, created_at, updated_at'

type CreateChapterInput = z.infer<typeof ChapterSchema>

type CreateChapterResponse = 
  | { success: true; chapter: ChapterRow }
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

  const { data: existing } = await supabase
    .from('chapter')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existing) {
    return { error: 'Chapter ID already exists' }
  }

  const now = new Date().toISOString()

  const { data: chapter, error: insertError } = await supabase
    .from('chapter')
    .insert({
      id,
      name,
      university,
      city: city || null,
      region: region || null,
      created_at: now,
      updated_at: now,
    })
    .select(CHAPTER_SELECT)
    .single<ChapterRow>()

  if (insertError || !chapter) {
    console.error('Failed to create chapter:', insertError)
    return { error: 'Failed to create chapter' }
  }

  revalidatePath('/admin/chapters')

  return {
    success: true,
    chapter,
  }
}

type GetChaptersResponse = 
  | { chapters: ChapterRow[] }
  | { error: string }

export async function getChapters(): Promise<GetChaptersResponse> {
  const { supabase } = await requireUser()

  const { data: chapters, error } = await supabase
    .from('chapter')
    .select(CHAPTER_SELECT)
    .order('name', { ascending: true })

  if (error || !chapters) {
    console.error('Failed to fetch chapters:', error)
    return { error: 'Failed to fetch chapters' }
  }

  return { chapters }
}
