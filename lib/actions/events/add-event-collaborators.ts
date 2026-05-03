'use server'

import { revalidatePath } from 'next/cache'
import { EventService } from '@/lib/services/event.service'
import { assertCanManageEvent } from './access'

export async function addEventCollaborators(
  eventId: string,
  chapter_ids: string[]
) {
  if (!eventId || eventId === 'new' || !chapter_ids.length) {
    return { error: 'Event ID and at least one chapter ID are required' }
  }

  const access = await assertCanManageEvent(eventId)
  if ('error' in access) return { error: access.error }
  const { supabase, user } = access

  const result = await EventService.addEventCollaboratorsBulk(supabase, eventId, chapter_ids, user.id)
  if (!result.success) {
    return { error: result.error ?? 'Failed to add collaborators' }
  }

  revalidatePath(`/chapter/events/${eventId}`)
  revalidatePath('/chapter/events')

  return { success: true }
}
