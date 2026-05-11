import { createClient } from '@/lib/supabase/server'
import { ChapterProfileService } from '@/lib/services/chapter-profile.service'

export async function getPublicChapterProfile(chapterId: string) {
  const supabase = await createClient()
  return ChapterProfileService.getPublicChapterProfile(supabase, chapterId)
}

export async function getPublicChapterDirectory() {
  const supabase = await createClient()
  return ChapterProfileService.getPublicChapterDirectory(supabase)
}
