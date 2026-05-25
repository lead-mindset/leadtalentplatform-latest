'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { EventService } from '@/lib/services/event.service'
import { assertCanAccessEvent } from './access'
import { PUBLIC_EVENTS_CACHE_TAG } from '@/lib/data/public-events'

export type DeleteEventResponse =
  | { success: true }
  | { error: string }

export async function deleteEvent(eventId: string): Promise<DeleteEventResponse> {
  const access = await assertCanAccessEvent(eventId, 'chapter.events.archive')
  if ('error' in access) return { error: access.error }
  const { supabase, user, event } = access

  const result = await EventService.deleteEvent(supabase, eventId, {
    actorUserId: user.id,
    chapterId: event.chapter_id,
    title: event.title,
  })
  if (!result.success) {
    return { error: result.error ?? 'Failed to delete event' }
  }

  revalidateTag(PUBLIC_EVENTS_CACHE_TAG, { expire: 0 })
  revalidatePath('/events')
  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  return { success: true }
}
