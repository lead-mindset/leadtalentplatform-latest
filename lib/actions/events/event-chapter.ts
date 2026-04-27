'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { EventService } from '@/lib/services/event.service'

export async function addEventCollaborator(eventId: string, chapter_id: string) {
  try {
    const authClient = await createClient()
    const supabase = createAdminClient()

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized - user not authenticated' }
    }

    const result = await EventService.addEventCollaborator(supabase, eventId, chapter_id, user.id)
    if ('error' in result) {
      return result
    }

    revalidatePath('/chapter/events')
    return { success: true, data: result.data }
  } catch {
    return { error: 'Internal server error' }
  }
}

export async function removeEventCollaborator(collaboratorId: string) {
  try {
    const authClient = await createClient()
    const supabase = createAdminClient()

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized - user not authenticated' }
    }

    const result = await EventService.removeEventCollaborator(supabase, collaboratorId)
    if ('error' in result) {
      return result
    }

    revalidatePath('/chapter/events')
    return { success: true }
  } catch {
    return { error: 'Internal server error' }
  }
}

export async function getEventCollaborators(eventId: string, ownerChapterId?: string) {
  try {
    const supabase = createAdminClient()
    return EventService.getEventCollaborators(supabase, eventId, ownerChapterId)
  } catch {
    return { error: 'Internal server error', data: [] }
  }
}
