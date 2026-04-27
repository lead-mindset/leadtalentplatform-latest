'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireChapterMember, requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
import { assertCanManageEvent } from './access'
import type {
  EventRow,
  EventWithDetails,
  RegistrationWithUser,
  Role,
} from '@/lib/types'

export async function getPublishedEvents(): Promise<EventWithDetails[]> {
  const supabase = await createClient()
  return EventService.getPublishedEvents(supabase)
}

export async function getEventById(id: string): Promise<EventWithDetails | null> {
  const supabase = await createClient()
  return EventService.getEventById(supabase, id)
}

export async function getMyRegistrations(): Promise<(EventRow & { event: EventRow | null })[]> {
  const { supabase, user } = await requireUser()
  return EventService.getMyRegistrations(supabase, user.id)
}

export async function getEditorChapterId(): Promise<string | null> {
  const { chapter_id } = await requireChapterMember()
  return chapter_id
}

export async function getChapterEvents(): Promise<(EventWithDetails & { is_owned_by_chapter: boolean })[]> {
  const { supabase } = await requireUser()
  const { chapter_id } = await requireChapterMember()

  if (!chapter_id) {
    console.error('[getChapterEvents] No chapter assigned')
    return []
  }

  return EventService.getChapterEvents(supabase, chapter_id)
}

export async function getAllEventsAdmin(): Promise<EventWithDetails[]> {
  const { supabase } = await requireAdmin()
  return EventService.getAllEventsAdmin(supabase)
}

export async function getEventRegistrations(eventId: string): Promise<RegistrationWithUser[]> {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) return []
  const { supabase } = access

  return EventService.getEventRegistrations(supabase, eventId)
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data } = await supabase
    .from('user')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  return (data?.role as Role) ?? null
}
