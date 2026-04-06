'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getEditorChapterId } from './get-data'
import type { EventRow } from '@/lib/types'

export type DeleteEventResponse =
  | { success: true }
  | { error: string }

export async function deleteEvent(eventId: string): Promise<DeleteEventResponse> {
  const { supabase, user } = await requireUser()

  const { data: existing } = await supabase
    .from('Event')
    .select('*')
    .eq('id', eventId)
    .maybeSingle<EventRow>()

  if (!existing) return { error: 'Event not found' }

  if (user.role === 'editor') {
    const chapterId = await getEditorChapterId()
    if (!chapterId) return { error: 'No chapter assigned' }
    if (existing.chapterId !== chapterId) return { error: 'Insufficient permissions' }
  } else if (user.role !== 'admin') {
    return { error: 'Insufficient permissions' }
  }

  const { error } = await supabase.from('Event').delete().eq('id', eventId)
  if (error) {
    console.error('[deleteEvent] Error:', error)
    return { error: 'Failed to delete event' }
  }

  revalidatePath('/events')
  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  return { success: true }
}

