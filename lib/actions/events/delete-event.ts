'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { requireChapterMember } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
// Note: EventRow type is defined in the service layer

export type DeleteEventResponse =
  | { success: true }
  | { error: string }

export async function deleteEvent(eventId: string): Promise<DeleteEventResponse> {
  const { supabase, user } = await requireUser()

  const event = await EventService.getEventById(supabase, eventId, 'id, chapter_id')

  if (!event) return { error: 'Event not found' }

  if (user.role === 'editor') {
    const { chapter_id } = await requireChapterMember()
    if (!chapter_id) return { error: 'No chapter assigned' }
    if (event.chapter_id !== chapter_id) return { error: 'Insufficient permissions' }
  } else if (user.role !== 'admin') {
    return { error: 'Insufficient permissions' }
  }

  const result = await EventService.deleteEvent(supabase, eventId)
  if (!result.success) {
    return { error: result.error ?? 'Failed to delete event' }
  }

  revalidatePath('/events')
  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  return { success: true }
}
