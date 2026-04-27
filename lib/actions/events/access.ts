'use server'

import { canUserAccessChapter, requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
import type { EventRow, Role } from '@/lib/types'

type EventManager = {
  id: string
  role: Role
}

type EventAccessSuccess = {
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase']
  user: EventManager
  event: Pick<EventRow, 'id' | 'chapter_id' | 'capacity' | 'title' | 'access_model'>
}

type EventAccessFailure = {
  error: string
}

export async function assertCanManageEvent(eventId: string): Promise<EventAccessSuccess | EventAccessFailure> {
  const { supabase, user } = await requireUser()

  const event = await EventService.getEventById(supabase, eventId, 'id, chapter_id, capacity, title, access_model')

  if (!event) {
    return { error: 'Event not found' }
  }

  if (user.role !== 'editor' && user.role !== 'admin') {
    return { error: 'Insufficient permissions' }
  }

  // Check if user can access this event (owner or collaborator)
  const canAccess = await canUserAccessChapter(supabase, user, event.chapter_id ?? '', eventId)
  if (!canAccess) {
    return { error: 'Insufficient permissions' }
  }

  return {
    supabase,
    user: {
      id: user.id,
      role: user.role,
    },
    event,
  }
}
