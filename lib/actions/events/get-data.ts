'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireChapterMember, requireUser } from '@/lib/auth'
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
  cover_image,
  start_at,
  end_at,
  location,
  meeting_url,
  event_type,
  capacity,
  is_published,
  access_model,
  application_form_url,
  chapter_id,
  created_by_id,
  created_at,
  updated_at,
  ownerChapter:Chapter!Event_chapter_id_fkey ( id, name, university ),
  collaborators:EventChapter (
    chapter:Chapter!EventChapter_chapter_id_fkey ( id, name, university, city, region )
  ),
  CreatedBy:User!Event_created_by_id_fkey ( id, name, email ),
  EventRegistration:EventRegistration!EventRegistration_event_id_fkey ( id, status )
`

type RegistrationEventRow = EventRegistrationRow & {
  Event: EventRow | EventRow[] | null
}

type RegistrationUserRow = EventRegistrationRow & {
  User:
    | (Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> & {
        StudentProfile:
          | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>
          | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>[]
          | null
      })
    | Array<
        Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> & {
          StudentProfile:
            | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>
            | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>[]
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
          | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>
          | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>[]
          | null
      })
    | Array<
        Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> & {
          StudentProfile:
            | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>
            | Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>[]
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
        event_id: c.event_id,
        chapter_id: c.chapter_id,
        added_at: c.added_at,
        added_by_id: c.added_by_id,
        Chapter: chapter,
        name: chapter?.name ?? 'Unknown Chapter',
      }
    })
    .filter((c: any) => c.Chapter)

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    cover_image: raw.cover_image ?? null,
    start_at: raw.start_at,
    end_at: raw.end_at,
    location: raw.location ?? null,
    meeting_url: raw.meeting_url ?? null,
    event_type: raw.event_type,
    capacity: raw.capacity ?? null,
    is_published: !!raw.is_published,
    access_model: raw.access_model,
    application_form_url: raw.application_form_url ?? null,
    chapter_id: raw.chapter_id ?? null,
    created_by_id: raw.created_by_id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    Chapter: ownerChapter,
    ownerChapter: ownerChapter,
    EventChapter: collaborators,
    collaborators,
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
    .from('event_with_chapter')
    .select(`
      id,
      title,
      description,
      cover_image,
      start_at,
      end_at,
      location,
      meeting_url,
      event_type,
      capacity,
      is_published,
      access_model,
      application_form_url,
      chapter_id,
      created_by_id,
      created_at,
      updated_at,
      chapter_name,
      chapter_university,
      chapter_city,
      chapter_region
    `)
    .eq('is_published', true)
    .order('start_at', { ascending: true })

  if (error || !data) {
    console.error('[getPublishedEvents] Error:', error)
    return []
  }

  const eventRows = data as any[]
  const eventIds = eventRows.map((event) => event.id)

  const { data: registrations, error: registrationsError } = await supabase
    .from('event_registration')
    .select('event_id, status')
    .in('event_id', eventIds)
    .eq('status', 'registered')

  if (registrationsError) {
    console.error('[getPublishedEvents] Registration count error:', registrationsError)
  }

  const countsByEventId = new Map<string, number>()
  for (const row of registrations ?? []) {
    countsByEventId.set(row.event_id, (countsByEventId.get(row.event_id) ?? 0) + 1)
  }

  return eventRows
    .map((event) => {
      const chapter = event.chapter_name ? {
        id: event.chapter_id,
        name: event.chapter_name,
        university: event.chapter_university,
        city: event.chapter_city,
        region: event.chapter_region,
        created_at: null,
        updated_at: null
      } : null
      
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        cover_image: event.cover_image,
        start_at: event.start_at,
        end_at: event.end_at,
        location: event.location,
        meeting_url: event.meeting_url,
        event_type: event.event_type,
        capacity: event.capacity,
        is_published: event.is_published,
        access_model: event.access_model,
        application_form_url: event.application_form_url,
        chapter_id: event.chapter_id,
        created_by_id: event.created_by_id,
        created_at: event.created_at,
        updated_at: event.updated_at,
        Chapter: chapter,
        ownerChapter: chapter,
        EventChapter: [],
        collaborators: [],
        CreatedBy: null,
        _count: {
          registrations: countsByEventId.get(event.id) ?? 0,
          chapters: 0,
        },
      }
    })
    .filter((e): e is EventWithDetails => e !== null)
}

export async function getEventById(id: string): Promise<EventWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_with_chapter')
    .select(`
      id,
      title,
      description,
      cover_image,
      start_at,
      end_at,
      location,
      meeting_url,
      event_type,
      capacity,
      is_published,
      access_model,
      application_form_url,
      chapter_id,
      created_by_id,
      created_at,
      updated_at,
      chapter_name,
      chapter_university,
      chapter_city,
      chapter_region
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[getEventById] Error:', error)
    return null
  }

  const { count, error: countError } = await supabase
    .from('event_registration')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'registered')

  if (countError) {
    console.error('[getEventById] Registration count error:', countError)
  }

  if (!data) {
    return null
  }

  // Transform the data to match EventWithDetails format
  const chapter = data.chapter_name ? {
    id: data.chapter_id,
    name: data.chapter_name,
    university: data.chapter_university,
    city: data.chapter_city,
    region: data.chapter_region,
    created_at: null,
    updated_at: null
  } : null

  const event: EventWithDetails = {
    id: data.id,
    title: data.title,
    description: data.description,
    cover_image: data.cover_image,
    start_at: data.start_at,
    end_at: data.end_at,
    location: data.location,
    meeting_url: data.meeting_url,
    event_type: data.event_type,
    capacity: data.capacity,
    is_published: data.is_published,
    access_model: data.access_model,
    application_form_url: data.application_form_url,
    chapter_id: data.chapter_id,
    created_by_id: data.created_by_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    Chapter: chapter,
    ownerChapter: chapter,
    EventChapter: [],
    collaborators: [],
    CreatedBy: null,
    _count: {
      registrations: count ?? 0,
      chapters: 0,
    },
  }

  return event
}

export async function getMyRegistrations(): Promise<(EventRegistrationRow & { Event: EventRow | null })[]> {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('event_registration_with_event')
    .select(`
      id,
      event_id,
      user_id,
      registered_at,
      status,
      qr_token,
      checked_in_at,
      checked_in_by_id,
      event_title,
      event_description,
      event_start_at,
      event_end_at,
      event_location,
      event_meeting_url,
      event_type,
      event_capacity,
      event_is_published,
      event_chapter_id,
      event_access_model
    `)
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false })

  if (error || !data) {
    console.error('[getMyRegistrations] Error:', error)
    return []
  }

  return (data as any[]).map((row) => {
    const event: EventRow | null = row.event_title ? {
      id: row.event_id,
      title: row.event_title,
      description: row.event_description,
      start_at: row.event_start_at,
      end_at: row.event_end_at,
      location: row.event_location,
      meeting_url: row.event_meeting_url,
      event_type: row.event_type,
      capacity: row.event_capacity,
      is_published: row.event_is_published,
      chapter_id: row.event_chapter_id,
      access_model: row.event_access_model,
      created_by_id: null,
      created_at: row.registered_at,
      updated_at: row.registered_at,
      cover_image: null,
      application_form_url: null
    } : null
    
    return { 
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      registered_at: row.registered_at,
      status: row.status,
      qr_token: row.qr_token,
      checked_in_at: row.checked_in_at,
      checked_in_by_id: row.checked_in_by_id,
      Event: event
    }
  })
}

export async function getEditorChapterId(): Promise<string | null> {
  const { chapterId } = await requireChapterMember()
  return chapterId
}

export async function getChapterEvents(): Promise<EventWithDetails[]> {
  const { supabase } = await requireUser()
  const { chapterId } = await requireChapterMember()

  if (!chapterId) {
    console.error('[getChapterEvents] No chapter assigned')
    return []
  }

  try {
    // Use the event_with_chapter view to avoid relationship errors
    const { data: ownedEvents, error: ownedError } = await supabase
      .from('event_with_chapter')
      .select(`
        id,
        title,
        description,
        cover_image,
        start_at,
        end_at,
        location,
        meeting_url,
        event_type,
        capacity,
        is_published,
        access_model,
        application_form_url,
        chapter_id,
        created_by_id,
        created_at,
        updated_at,
        chapter_name,
        chapter_university,
        chapter_city,
        chapter_region
      `)
      .eq('chapter_id', chapterId)
      .order('start_at', { ascending: false })

    if (ownedError) {
      console.error('[getChapterEvents] Owned events error:', ownedError)
    }

    const { data: eventChapterRecords, error: ecError } = await (supabase as any)
      .from('event_chapter')
      .select('event_id')
      .eq('chapter_id', chapterId)

    if (ecError) {
      console.error('[getChapterEvents] EventChapter lookup error:', ecError)
    }

    let collaboratedEvents: any[] = []

    if (eventChapterRecords && eventChapterRecords.length > 0) {
      const eventIds = eventChapterRecords.map((r: any) => r.event_id)

      const { data: collabData, error: collabError } = await supabase
        .from('event_with_chapter')
        .select(`
          id,
          title,
          description,
          cover_image,
          start_at,
          end_at,
          location,
          meeting_url,
          event_type,
          capacity,
          is_published,
          access_model,
          application_form_url,
          chapter_id,
          created_by_id,
          created_at,
          updated_at,
          chapter_name,
          chapter_university,
          chapter_city,
          chapter_region
        `)
        .in('id', eventIds)
        .order('start_at', { ascending: false })

      if (collabError) {
        console.error('[getChapterEvents] Collaborated events error:', collabError)
      }

      collaboratedEvents = collabData || []
    }

    // Transform the data to match EventWithDetails format
    const transformEventData = (event: any): EventWithDetails => {
      const chapter = event.chapter_name ? {
        id: event.chapter_id,
        name: event.chapter_name,
        university: event.chapter_university,
        city: event.chapter_city,
        region: event.chapter_region,
        created_at: null,
        updated_at: null
      } : null

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        cover_image: event.cover_image,
        start_at: event.start_at,
        end_at: event.end_at,
        location: event.location,
        meeting_url: event.meeting_url,
        event_type: event.event_type,
        capacity: event.capacity,
        is_published: event.is_published,
        access_model: event.access_model,
        application_form_url: event.application_form_url,
        chapter_id: event.chapter_id,
        created_by_id: event.created_by_id,
        created_at: event.created_at,
        updated_at: event.updated_at,
        Chapter: chapter,
        ownerChapter: chapter,
        EventChapter: [],
        collaborators: [],
        CreatedBy: null,
        _count: {
          registrations: 0,
          chapters: 0,
        },
      }
    }

    const allEvents = [...(ownedEvents || []), ...collaboratedEvents]
    const uniqueEvents = allEvents.reduce((acc: any[], event: any) => {
      if (!acc.find((e) => e.id === event.id)) acc.push(event)
      return acc
    }, [])

    return uniqueEvents.map(transformEventData)
      .map((event) => ({
        ...event,
        isOwnedByChapter: event.chapter_id === chapterId,
      }))
      .filter((e): e is EventWithDetails & { isOwnedByChapter: boolean } => e !== null)

  } catch (error) {
    console.error('[getChapterEvents] Unexpected error:', error)
    return []
  }
}

export async function getAllEventsAdmin(): Promise<EventWithDetails[]> {
  const { supabase } = await requireAdmin()

  const { data, error } = await supabase
    .from('event')
    .select(EVENT_SELECT)
    .order('start_at', { ascending: false })

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
    event_id: raw.event_id,
    user_id: raw.user_id,
    registered_at: raw.registered_at,
    status: raw.status,
    qr_token: raw.qr_token,
    checked_in_at: raw.checked_in_at ?? null,
    checked_in_by_id: raw.checked_in_by_id ?? null,
    User: u ?? null,
    StudentProfile: profile ?? null,
  }
}

export async function getEventRegistrations(eventId: string): Promise<RegistrationWithUser[]> {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) return []
  const { supabase } = access

  const { data, error } = await supabase
    .from('event_registration')
    .select(`
      id,
      event_id,
      user_id,
      registered_at,
      status,
      qr_token,
      checked_in_at,
      checked_in_by_id,
      User:User!EventRegistration_user_id_fkey (
        id,
        name,
        email,
        phone,
        StudentProfile!inner ( major, graduation_year, linkedin_url )
      )
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })

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
    .from('user')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  return (data?.role as Role) ?? null
}

