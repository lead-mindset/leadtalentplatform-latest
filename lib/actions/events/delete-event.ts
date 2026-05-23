'use server'

import { revalidatePath } from 'next/cache'
import { EventService } from '@/lib/services/event.service'
import { assertCanAccessEvent } from './access'

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

  revalidatePath('/events')
  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  return { success: true }
}
