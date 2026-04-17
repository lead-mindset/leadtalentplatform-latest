'use server'

import { canUserAccessChapter, requireUser } from '@/lib/auth'
import type { EventRow, Role } from '@/lib/types'

type EventManager = {
  id: string
  role: Role
}

type EventAccessSuccess = {
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase']
  user: EventManager
  event: Pick<EventRow, 'id' | 'chapterId' | 'capacity' | 'title' | 'accessModel'>
}

type EventAccessFailure = {
  error: string
}

export async function assertCanManageEvent(eventId: string): Promise<EventAccessSuccess | EventAccessFailure> {
  const { supabase, user } = await requireUser()

  const { data: event, error } = await supabase
    .from('event')
    .select('id, chapterId, capacity, title, accessModel')
    .eq('id', eventId)
    .maybeSingle<Pick<EventRow, 'id' | 'chapterId' | 'capacity' | 'title' | 'accessModel'>>()

  if (error || !event) {
    return { error: 'Event not found' }
  }

  if (user.role !== 'editor' && user.role !== 'admin') {
    return { error: 'Insufficient permissions' }
  }

  // Check if user can access this event (owner or collaborator)
  const canAccess = await canUserAccessChapter(supabase, user, event.chapterId, eventId)
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
