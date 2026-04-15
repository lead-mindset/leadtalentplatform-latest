'use server'

import { createClient } from '@/lib/supabase/server'
import type { ChapterRow } from '@/lib/types'

export async function getAllChapters(): Promise<ChapterRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Chapter')
    .select('id, name, university, city, region, createdAt, updatedAt')
    .order('name', { ascending: true })

  if (error) {
    console.error('[getAllChapters] Error:', error)
    return []
  }

  return data || []
}

export async function getChapterById(id: string): Promise<ChapterRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Chapter')
    .select('id, name, university, city, region, createdAt, updatedAt')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[getChapterById] Error:', error)
    return null
  }

  return data
}
