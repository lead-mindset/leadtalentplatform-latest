'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireUser } from '@/lib/auth'
import type {
  EventRow,
  EventWithDetails,
  EventWithDetailsRaw,
  RegistrationWithUser,
  RegistrationWithUserRaw,
  EventRegistrationRow,
  Role,
} from '@/lib/types'

const EVENT_SELECT = `
  id,
  title,
  description,
  coverImage,
  startAt,
  endAt,
  location,
  meetingUrl,
  eventType,
  capacity,
  isPublished,
  chapterId,
  createdById,
  createdAt,
  updatedAt,
  Chapter:Chapter!Event_chapterId_fkey ( id, name, university ),
  CreatedBy:User!Event_createdById_fkey ( id, name, email ),
  EventRegistration:EventRegistration ( id )
`

function mapEvent(raw: any): EventWithDetails | null {
  if (!raw) return null
  const chapter = Array.isArray(raw.Chapter) ? raw.Chapter[0] : raw.Chapter
  const createdBy = Array.isArray(raw.CreatedBy) ? raw.CreatedBy[0] : raw.CreatedBy
  const registrations = Array.isArray(raw.EventRegistration)
    ? raw.EventRegistration
    : []

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    coverImage: raw.coverImage ?? null,
    startAt: raw.startAt,
    endAt: raw.endAt,
    location: raw.location ?? null,
    meetingUrl: raw.meetingUrl ?? null,
    eventType: raw.eventType,
    capacity: raw.capacity ?? null,
    isPublished: !!raw.isPublished,
    chapterId: raw.chapterId ?? null,
    createdById: raw.createdById,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    Chapter: chapter ?? null,
    CreatedBy: createdBy ?? null,
    _count: { registrations: registrations.length },
  }
}

export async function getPublishedEvents(): Promise<EventWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Event')
    .select(EVENT_SELECT)
    .eq('isPublished', true)
    .order('startAt', { ascending: true })

  if (error || !data) {
    console.error('[getPublishedEvents] Error:', error)
    return []
  }

  return (data as EventWithDetailsRaw[])
    .map(mapEvent)
    .filter((e): e is EventWithDetails => e !== null)
}

export async function getEventById(id: string): Promise<EventWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Event')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[getEventById] Error:', error)
    return null
  }

  return mapEvent(data)
}

export async function getMyRegistrations(): Promise<(EventRegistrationRow & { Event: EventRow | null })[]> {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('EventRegistration')
    .select(`
      id,
      eventId,
      userId,
      registeredAt,
      status,
      qrToken,
      checkedInAt,
      checkedInById,
      Event:Event!EventRegistration_eventId_fkey ( * )
    `)
    .eq('userId', user.id)
    .order('registeredAt', { ascending: false })

  if (error || !data) {
    console.error('[getMyRegistrations] Error:', error)
    return []
  }

  return data.map((row: any) => {
    const event = Array.isArray(row.Event) ? row.Event[0] : row.Event
    return { ...row, Event: event ?? null }
  })
}

export async function getEditorChapterId(): Promise<string | null> {
  const { supabase, user } = await requireUser()
  if (user.role !== 'editor') return null

  const { data, error } = await supabase
    .from('StudentProfile')
    .select('chapterId')
    .eq('userId', user.id)
    .maybeSingle()

  if (error) return null
  return data?.chapterId ?? null
}

export async function getChapterEvents(): Promise<EventWithDetails[]> {
  const { supabase, user } = await requireUser()
  if (user.role !== 'editor') return []

  const chapterId = await getEditorChapterId()
  if (!chapterId) return []

  const { data, error } = await supabase
    .from('Event')
    .select(EVENT_SELECT)
    .eq('chapterId', chapterId)
    .order('startAt', { ascending: false })

  if (error || !data) {
    console.error('[getChapterEvents] Error:', error)
    return []
  }

  return (data as EventWithDetailsRaw[])
    .map(mapEvent)
    .filter((e): e is EventWithDetails => e !== null)
}

export async function getAllEventsAdmin(): Promise<EventWithDetails[]> {
  const { supabase } = await requireAdmin()

  const { data, error } = await supabase
    .from('Event')
    .select(EVENT_SELECT)
    .order('startAt', { ascending: false })

  if (error || !data) {
    console.error('[getAllEventsAdmin] Error:', error)
    return []
  }

  return (data as EventWithDetailsRaw[])
    .map(mapEvent)
    .filter((e): e is EventWithDetails => e !== null)
}

function mapRegistration(raw: any): RegistrationWithUser | null {
  if (!raw) return null
  const u = Array.isArray(raw.User) ? raw.User[0] : raw.User
  return {
    id: raw.id,
    eventId: raw.eventId,
    userId: raw.userId,
    registeredAt: raw.registeredAt,
    status: raw.status,
    qrToken: raw.qrToken,
    checkedInAt: raw.checkedInAt ?? null,
    checkedInById: raw.checkedInById ?? null,
    User: u ?? null,
  }
}

export async function getEventRegistrations(eventId: string): Promise<RegistrationWithUser[]> {
  const { supabase, user } = await requireUser()

  if (user.role !== 'editor' && user.role !== 'admin') return []

  const { data, error } = await supabase
    .from('EventRegistration')
    .select(`
      id,
      eventId,
      userId,
      registeredAt,
      status,
      qrToken,
      checkedInAt,
      checkedInById,
      User:User!EventRegistration_userId_fkey ( id, name, email, phone )
    `)
    .eq('eventId', eventId)
    .order('registeredAt', { ascending: true })

  if (error || !data) {
    console.error('[getEventRegistrations] Error:', error)
    return []
  }

  return (data as RegistrationWithUserRaw[])
    .map(mapRegistration)
    .filter((r): r is RegistrationWithUser => r !== null)
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data } = await supabase
    .from('User')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  return (data?.role as Role) ?? null
}

