'use server'

import { revalidatePath } from 'next/cache'
import { EventService } from '@/lib/services/event.service'
import { assertCanManageEvent } from './access'

export type DeleteEventResponse =
  | { success: true }
  | { error: string }

export async function deleteEvent(eventId: string): Promise<DeleteEventResponse> {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) return { error: access.error }
  const { supabase } = access

  const result = await EventService.deleteEvent(supabase, eventId)
  if (!result.success) {
    return { error: result.error ?? 'Failed to delete event' }
  }

  revalidatePath('/events')
  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  return { success: true }
}
