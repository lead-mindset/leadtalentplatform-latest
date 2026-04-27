import { createClient } from '@/lib/supabase/server'
import { ChapterService } from '@/lib/services/chapter.service'
import type { ChapterRow } from '@/lib/types'

export async function getAllChapters(): Promise<ChapterRow[]> {
  const supabase = await createClient()
  return ChapterService.getAllChapters(supabase)
}

export async function getChapterById(id: string): Promise<ChapterRow | null> {
  const supabase = await createClient()
  return ChapterService.getChapterById(supabase, id)
}
