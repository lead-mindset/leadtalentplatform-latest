'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { EventService } from '@/lib/services/event.service'
import { assertCanManageEvent } from './access'

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function addEventCollaborator(eventId: string, chapter_id: string) {
  try {
    const access = await assertCanManageEvent(eventId)
    if ('error' in access) return access
    const { supabase, user } = access

    const result = await EventService.addEventCollaborator(supabase, eventId, chapter_id, user.id)
    if ('error' in result) {
      return result
    }

    revalidatePath('/chapter/events')
    return toPlain({ success: true, data: result.data })
  } catch {
    return { error: 'Internal server error' }
  }
}

export async function removeEventCollaborator(collaboratorId: string) {
  try {
    const supabase = await createClient()

    const { data: collaborator, error: collaboratorError } = await supabase
      .from('event_chapter')
      .select('event_id')
      .eq('id', collaboratorId)
      .maybeSingle()

    if (collaboratorError || !collaborator?.event_id) {
      return { error: 'Collaborator not found' }
    }

    const access = await assertCanManageEvent(collaborator.event_id)
    if ('error' in access) return access

    const result = await EventService.removeEventCollaborator(access.supabase, collaboratorId)
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
    const access = await assertCanManageEvent(eventId)
    if ('error' in access) return { ...access, data: [] }

    return toPlain(await EventService.getEventCollaborators(access.supabase, eventId, ownerChapterId))
  } catch {
    return { error: 'Internal server error', data: [] }
  }
}
