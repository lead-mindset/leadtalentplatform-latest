'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { EventService } from '@/lib/services/event.service'

export async function addEventCollaborators(
  eventId: string,
  chapter_ids: string[]
) {
  if (!eventId || eventId === 'new' || !chapter_ids.length) {
    return { error: 'Event ID and at least one chapter ID are required' }
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Authentication required' }
  }

  const result = await EventService.addEventCollaboratorsBulk(supabase, eventId, chapter_ids, user.id)
  if (!result.success) {
    return { error: result.error ?? 'Failed to add collaborators' }
  }

  revalidatePath(`/chapter/events/${eventId}`)
  revalidatePath('/chapter/events')

  return { success: true }
}
