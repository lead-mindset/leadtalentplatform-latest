'use server'

import { requireChapterEditor, requireUser } from '@/lib/auth'
import { getEditorChapterId } from './get-data'
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
    .from('Event')
    .select('id, chapterId, capacity, title, accessModel')
    .eq('id', eventId)
    .maybeSingle<Pick<EventRow, 'id' | 'chapterId' | 'capacity' | 'title' | 'accessModel'>>()

  if (error || !event) {
    return { error: 'Event not found' }
  }

  if (user.role !== 'editor' && user.role !== 'admin') {
    return { error: 'Insufficient permissions' }
  }

  if (user.role === 'editor') {
    const { chapterId } = await requireChapterEditor()
    if (event.chapterId !== chapterId) {
      return { error: 'Insufficient permissions' }
    }
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
