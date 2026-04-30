import { createClient } from '@/lib/supabase/server'
import { ChapterService } from '@/lib/services/chapter.service'
import type { MemberWithProfile } from '@/lib/types'

export async function getChapterMembers(
  chapter_id: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()
  return ChapterService.getChapterMembers(supabase, chapter_id)
}

export function getMemberStats(members: MemberWithProfile[]) {
  return ChapterService.getMemberStats(members)
}

export async function getRecentChapterActivity(
  chapter_id: string,
  limit: number = 5
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()
  return ChapterService.getRecentChapterActivity(supabase, chapter_id, limit)
}
