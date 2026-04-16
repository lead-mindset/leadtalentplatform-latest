'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireChapterEditor, requireUser } from '@/lib/auth'
import { assertCanManageEvent } from './access'
import type {
  EventRow,
  EventWithDetails,
  EventWithDetailsRaw,
  RegistrationWithUser,
  EventRegistrationRow,
  Role,
  StudentProfileRow,
  UserRow,
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
  accessModel,
  applicationFormUrl,
  chapterId,
  createdById,
  createdAt,
  updatedAt,
  ownerChapter:Chapter!Event_chapterId_fkey ( id, name, university ),
  collaborators:EventChapter (
    chapter:Chapter!EventChapter_chapterId_fkey ( id, name, university, city, region )
  ),
  CreatedBy:User!Event_createdById_fkey ( id, name, email ),
  EventRegistration:EventRegistration!EventRegistration_eventId_fkey ( id, status )
`

type RegistrationEventRow = EventRegistrationRow & {
  Event: EventRow | EventRow[] | null
}

type RegistrationUserRow = EventRegistrationRow & {
  User:
    | (Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> & {
        StudentProfile:
          | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>
          | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>[]
          | null
      })
    | Array<
        Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> & {
          StudentProfile:
            | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>
            | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>[]
            | null
        }
      >
    | null
}

type RegistrationWithEventRow = EventRegistrationRow & {
  Event: EventRow | EventRow[] | null
  User:
    | (Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> & {
        StudentProfile:
          | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>
          | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>[]
          | null
      })
    | Array<
        Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> & {
          StudentProfile:
            | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>
            | Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>[]
            | null
        }
      >
    | null
}

function mapEvent(raw: any, registeredCount = 0): EventWithDetails | null {
  if (!raw) return null

  const ownerChapter = raw.ownerChapter ?? null
  const createdBy = raw.CreatedBy ?? null

  const collaborators = (raw.collaborators ?? [])
    .map((c: any) => {
      const chapter = c.chapter ?? null
      return {
        id: c.id,
        eventId: c.eventId,
        chapterId: c.chapterId,
        addedAt: c.addedAt,
        addedById: c.addedById,
        Chapter: chapter,
        name: chapter?.name ?? 'Unknown Chapter',
      }
    })
    .filter((c: any) => c.Chapter)

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
    accessModel: raw.accessModel,
    applicationFormUrl: raw.applicationFormUrl ?? null,
    chapterId: raw.chapterId ?? null,
    createdById: raw.createdById,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    Chapter: ownerChapter,
    ownerChapter: ownerChapter, // add this so the UI field works too
    EventChapter: collaborators,
    collaborators,              // add this so the UI field works too
    CreatedBy: createdBy,
    _count: {
      registrations: registeredCount,
      chapters: collaborators.length,
    },
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

  const eventRows = data as any[]
  const eventIds = eventRows.map((event) => event.id)

  const { data: registrations, error: registrationsError } = await supabase
    .from('EventRegistration')
    .select('eventId, status')
    .in('eventId', eventIds)
    .eq('status', 'registered')

  if (registrationsError) {
    console.error('[getPublishedEvents] Registration count error:', registrationsError)
  }

  const countsByEventId = new Map<string, number>()
  for (const row of registrations ?? []) {
    countsByEventId.set(row.eventId, (countsByEventId.get(row.eventId) ?? 0) + 1)
  }
  return eventRows
    .map((event) => mapEvent(event, countsByEventId.get(event.id) ?? 0))
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

  const { count, error: countError } = await supabase
    .from('EventRegistration')
    .select('id', { count: 'exact', head: true })
    .eq('eventId', id)
    .eq('status', 'registered')

  if (countError) {
    console.error('[getEventById] Registration count error:', countError)
  }

  return mapEvent(data, count ?? 0)
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

  return (data as unknown as RegistrationWithEventRow[]).map((row) => {
    const event = Array.isArray(row.Event) ? row.Event[0] : row.Event
    return { ...row, Event: event ?? null }
  })
}

export async function getEditorChapterId(): Promise<string | null> {
  const { chapterId } = await requireChapterEditor()
  return chapterId
}

export async function getChapterEvents(): Promise<EventWithDetails[]> {
  const { supabase, chapterId } = await requireChapterEditor()

  const { data, error } = await supabase
    .from('Event')
    .select(EVENT_SELECT)
    .order('startAt', { ascending: false })

  if (error || !data) {
    console.error('[getChapterEvents] Error:', error)
    return []
  }

  const events = (data as any[])
    .map(event => mapEvent(event, 0))
    .filter((e): e is EventWithDetails => e !== null)
  
  return events.map(event => ({
    ...event,
    isOwnedByChapter: event.chapterId === chapterId
  }))
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

  return (data as any[])
    .map(event => mapEvent(event, 0))
    .filter((e): e is EventWithDetails => e !== null)
}

function mapRegistration(raw: RegistrationUserRow | null): RegistrationWithUser | null {
  if (!raw) return null
  const u = Array.isArray(raw.User) ? raw.User[0] : raw.User
  const profile = Array.isArray(u?.StudentProfile) ? u.StudentProfile[0] : u?.StudentProfile
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
    StudentProfile: profile ?? null,
  }
}

export async function getEventRegistrations(eventId: string): Promise<RegistrationWithUser[]> {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) return []
  const { supabase } = access

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
      User:User!EventRegistration_userId_fkey (
        id,
        name,
        email,
        phone,
        StudentProfile!StudentProfile_userId_fkey ( major, graduationYear, linkedinUrl )
      )
    `)
    .eq('eventId', eventId)
    .order('registeredAt', { ascending: true })

  if (error || !data) {
    console.error('[getEventRegistrations] Error:', error)
    return []
  }

  return (data as unknown as RegistrationUserRow[])
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

