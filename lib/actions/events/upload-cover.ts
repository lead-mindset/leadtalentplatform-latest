'use server'

import { requireChapterEditor } from '@/lib/auth'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { EventService } from '@/lib/services/event.service'

const MAX_FILE_SIZE = 2 * 1024 * 1024

export async function uploadEventCover(formData: FormData) {
  const { supabase, user, chapter_id } = await requireChapterEditor()

  if (user.role !== 'admin') {
    if (!chapter_id) throw new Error('No chapter assigned')

    const permission = await ChapterPermissionService.requireChapterPermission(supabase, {
      userId: user.id,
      chapterId: chapter_id,
      permissionKey: 'chapter.events.manage',
    })
    if (!permission.success) throw new Error(permission.error)
  }

  const file = formData.get('cover') as File | null
  if (!file) throw new Error('Cover image file is required')
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed')
  if (file.size > MAX_FILE_SIZE) throw new Error('Cover image must be 2MB or smaller')

  const result = await EventService.uploadEventCover(supabase, user.id, file)
  return result
}
