'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireChapterEditor, requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
import { ChapterPermissionService, type ChapterPermissionKey } from '@/lib/services/chapter-permission.service'
import { getCachedPublishedEvents } from '@/lib/data/public-events'
import { assertCanAccessEvent } from './access'
import type {
  EventWithDetails,
  RegistrationWithUser,
  Role,
} from '@/lib/types'

export async function getPublishedEvents(): Promise<EventWithDetails[]> {
  return getCachedPublishedEvents()
}

export async function getEventById(id: string): Promise<EventWithDetails | null> {
  const supabase = await createClient()
  return EventService.getEventByIdWithDetails(supabase, id)
}

export async function getMyRegistrations(): Promise<Awaited<ReturnType<typeof EventService.getMyRegistrations>>> {
  const { supabase, user } = await requireUser()
  return EventService.getMyRegistrations(supabase, user.id)
}

export async function getEditorChapterId(): Promise<string | null> {
  const { chapter_id } = await requireChapterEditor()
  return chapter_id
}

export async function getChapterEvents(
  requiredPermission: ChapterPermissionKey = 'chapter.events.manage'
): Promise<(EventWithDetails & { is_owned_by_chapter: boolean })[]> {
  const { supabase, user, chapter_id } = await requireChapterEditor()

  if (!chapter_id) {
    console.error('[getChapterEvents] No chapter assigned')
    return []
  }

  const permission = await ChapterPermissionService.requireChapterPermission(supabase, {
    userId: user.id,
    chapterId: chapter_id,
    permissionKey: requiredPermission,
  })
  if (!permission.success) return []

  return EventService.getChapterEvents(supabase, chapter_id)
}

export type ChapterEventPermissionFlags = {
  canManageEvents: boolean
  canViewRegistrations: boolean
  canCheckIn: boolean
  canArchiveEvents: boolean
}

export async function getChapterEventPermissionFlags(): Promise<ChapterEventPermissionFlags> {
  const { supabase, user, chapter_id } = await requireChapterEditor()

  if (user.role === 'admin') {
    return {
      canManageEvents: true,
      canViewRegistrations: true,
      canCheckIn: true,
      canArchiveEvents: true,
    }
  }

  if (!chapter_id) {
    return {
      canManageEvents: false,
      canViewRegistrations: false,
      canCheckIn: false,
      canArchiveEvents: false,
    }
  }

  const permissions = await ChapterPermissionService.getChapterPermissionSet(supabase, {
    userId: user.id,
    chapterId: chapter_id,
  })

  return {
    canManageEvents: permissions.includes('chapter.events.manage'),
    canViewRegistrations: permissions.includes('chapter.events.view_registrations'),
    canCheckIn: permissions.includes('chapter.events.check_in'),
    canArchiveEvents: permissions.includes('chapter.events.archive'),
  }
}

export async function getAllEventsAdmin(): Promise<EventWithDetails[]> {
  const { supabase } = await requireAdmin()
  return EventService.getAllEventsAdmin(supabase)
}

export async function getEventRegistrations(eventId: string): Promise<RegistrationWithUser[]> {
  const access = await assertCanAccessEvent(eventId, 'chapter.events.view_registrations')
  if ('error' in access) return []
  const { supabase } = access

  return EventService.getEventRegistrations(supabase, eventId)
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  return (await EventService.getUserRole(supabase, auth.user.id)) as Role | null
}
