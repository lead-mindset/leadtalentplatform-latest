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
    
    // Check if user's chapter is the owner
    const isOwner = event.chapterId === chapterId
    
    // Check if user's chapter is a collaborator using two-step approach
    let isCollaborator = false
    if (!isOwner) {
      const { data: collaboration, error: collabError } = await (supabase as any)
        .from('EventChapter')
        .select('id')
        .eq('eventId', eventId)
        .eq('chapterId', chapterId)
        .maybeSingle()
      
      isCollaborator = !collabError && collaboration !== null
    }
    
    if (!isOwner && !isCollaborator) {
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
