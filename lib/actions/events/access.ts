'use server'

import { canUserAccessEventWithPermission, canUserManageEvent, requireUser } from '@/lib/auth'
import type { ChapterPermissionKey } from '@/lib/services/chapter-permission.service'
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

  const access = await canUserManageEvent(supabase, user, eventId)
  if (!access.allowed) {
    return { error: access.error }
  }

  return {
    supabase,
    user: {
      id: user.id,
      role: user.role,
    },
    event: access.event,
  }
}

export async function assertCanAccessEvent(
  eventId: string,
  permissionKey: ChapterPermissionKey
): Promise<EventAccessSuccess | EventAccessFailure> {
  const { supabase, user } = await requireUser()

  const access = await canUserAccessEventWithPermission(supabase, user, eventId, permissionKey)
  if (!access.allowed) {
    return { error: access.error }
  }

  return {
    supabase,
    user: {
      id: user.id,
      role: user.role,
    },
    event: access.event,
  }
}
