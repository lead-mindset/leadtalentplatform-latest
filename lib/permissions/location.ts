import type { EventRow, ChapterRow, UserRow } from '@/lib/types'

interface UserChapter extends ChapterRow {
  role: 'admin' | 'editor' | 'member'
}

export function canEditLocation(
  event: EventRow | null,
  user: UserRow | null,
  userChapter: UserChapter | null
): boolean {
  if (!event || !user) return false

  if (event.created_by_id === user.id) {
    return true
  }

  // Chapter admins can edit location for events in their chapter
  if (userChapter?.id === event.chapter_id && userChapter.role === 'admin') {
    return true
  }

  return false
}

export function isLocationDisabled(
  event: EventRow | null,
  user: UserRow | null,
  userChapter: ChapterRow | null
): boolean {
  return !canEditLocation(event, user, userChapter)
}
