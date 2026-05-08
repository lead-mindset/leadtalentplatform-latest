'use server'

import { createClient } from '@/lib/supabase/server'
import { ChapterService } from '@/lib/services/chapter.service'
import type { ChapterRow } from '@/lib/types'

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function getAllChapters(): Promise<ChapterRow[]> {
  const supabase = await createClient()
  return toPlain(await ChapterService.getAllChapters(supabase))
}

export async function getChapterById(id: string): Promise<ChapterRow | null> {
  const supabase = await createClient()
  return toPlain(await ChapterService.getChapterById(supabase, id))
}
