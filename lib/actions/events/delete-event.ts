'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { requireChapterMember } from '@/lib/auth'
import type { EventRow } from '@/lib/types'

const EVENT_LOOKUP_SELECT = 'id, chapter_id'

export type DeleteEventResponse =
  | { success: true }
  | { error: string }

export async function deleteEvent(eventId: string): Promise<DeleteEventResponse> {
  const { supabase, user } = await requireUser()

  const { data: existing } = await supabase
    .from('event')
    .select(EVENT_LOOKUP_SELECT)
    .eq('id', eventId)
    .maybeSingle<Pick<EventRow, 'id' | 'chapter_id'>>()

  if (!existing) return { error: 'Event not found' }

  if (user.role === 'editor') {
    const { chapter_id } = await requireChapterMember()
    if (!chapter_id) return { error: 'No chapter assigned' }
    if (existing.chapter_id !== chapter_id) return { error: 'Insufficient permissions' }
  } else if (user.role !== 'admin' && user.role !== 'editor') {
    return { error: 'Insufficient permissions' }
  }

  const { error } = await supabase.from('event').delete().eq('id', eventId)
  if (error) {
    console.error('[deleteEvent] Error:', error)
    return { error: 'Failed to delete event' }
  }

  revalidatePath('/events')
  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  return { success: true }
}

