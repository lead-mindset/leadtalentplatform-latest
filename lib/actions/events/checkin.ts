'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getEditorChapterId } from './get-data'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'

type CheckInState = 'success' | 'already_checked_in' | 'not_registered'

export type CheckInCounter = {
  checkedIn: number
  total: number
}

export type CheckInCandidate =
  | {
      ok: true
      status: 'ready'
      registrationId: string
      eventId: string
      attendee: { id: string; name: string; email: string }
    }
  | {
      ok: true
      status: 'already_checked_in'
      eventId: string
      attendee: { id: string; name: string; email: string }
      checkedInAt: string
      checkedInByName: string | null
      counter: CheckInCounter
    }
  | { ok: false; error: string }

export type CheckInResponse =
  | {
      success: true
      state: CheckInState
      message: string
      registration: EventRegistrationRow
      attendee: { id: string; name: string; email: string }
      counter: CheckInCounter
    }
  | { error: string }

export type CheckInSearchResult = {
  registrationId: string
  userId: string
  name: string
  email: string
  status: RegistrationStatus
  checkedInAt: string | null
}

async function assertEventAccess(eventId: string) {
  const { supabase, user } = await requireUser()
  if (user.role !== 'editor' && user.role !== 'admin') return { supabase, user, error: 'Insufficient permissions' as const }

  const { data: event, error: eventError } = await supabase
    .from('Event')
    .select('*')
    .eq('id', eventId)
    .maybeSingle<EventRow>()

  if (eventError || !event) return { supabase, user, error: 'Event not found' as const }

  if (user.role === 'editor') {
    const chapterId = await getEditorChapterId()
    if (!chapterId) return { supabase, user, error: 'No chapter assigned' as const }
    if (event.chapterId !== chapterId) return { supabase, user, error: 'Insufficient permissions' as const }
  }

  return { supabase, user, event }
}

export async function getCheckInCounter(eventId: string): Promise<CheckInCounter | null> {
  const access = await assertEventAccess(eventId)
  if ('error' in access) return null
  const { supabase } = access

  const { data, error } = await supabase
    .from('EventRegistration')
    .select('status')
    .eq('eventId', eventId)

  if (error || !data) return null

  const checkedIn = data.filter((registration) => registration.status === 'attended').length
  const total = data.filter((registration) => registration.status === 'registered' || registration.status === 'attended').length

  return { checkedIn, total }
}

export async function resolveCheckInCandidate(formData: FormData): Promise<CheckInCandidate> {
  const token = String(formData.get('qrToken') ?? '').trim()
  const eventId = String(formData.get('eventId') ?? '').trim()
  if (!token) return { ok: false, error: 'Missing token' }
  if (!eventId) return { ok: false, error: 'Select an event first' }

  const access = await assertEventAccess(eventId)
  if ('error' in access) return { ok: false, error: access.error }
  const { supabase } = access

  const { data: registration, error } = await supabase
    .from('EventRegistration')
    .select(`
      id, eventId, userId, checkedInAt, checkedInById, status,
      User:User!EventRegistration_userId_fkey ( id, name, email )
    `)
    .eq('qrToken', token)
    .maybeSingle()

  if (error || !registration) return { ok: false, error: 'Not registered for this event' }
  if (registration.eventId !== eventId) return { ok: false, error: 'Not registered for this event' }

  const attendee = Array.isArray(registration.User) ? registration.User[0] : registration.User
  const attendeePayload = {
    id: attendee?.id ?? registration.userId,
    name: attendee?.name ?? 'Unknown attendee',
    email: attendee?.email ?? 'unknown@email',
  }

  if (registration.checkedInAt || registration.status === 'attended') {
    let checkedInByName: string | null = null
    if (registration.checkedInById) {
      const { data: checker } = await supabase
        .from('User')
        .select('name')
        .eq('id', registration.checkedInById)
        .maybeSingle()
      checkedInByName = checker?.name ?? null
    }
    const counter = await getCheckInCounter(eventId)
    return {
      ok: true,
      status: 'already_checked_in',
      eventId,
      attendee: attendeePayload,
      checkedInAt: registration.checkedInAt ?? new Date().toISOString(),
      checkedInByName,
      counter: counter ?? { checkedIn: 0, total: 0 },
    }
  }

  if (registration.status !== 'registered') {
    return { ok: false, error: 'Not registered for this event' }
  }

  return {
    ok: true,
    status: 'ready',
    registrationId: registration.id,
    eventId,
    attendee: attendeePayload,
  }
}

export async function searchAttendeesForCheckIn(formData: FormData): Promise<CheckInSearchResult[]> {
  const eventId = String(formData.get('eventId') ?? '').trim()
  const query = String(formData.get('query') ?? '').trim()
  if (!eventId || query.length < 2) return []

  const access = await assertEventAccess(eventId)
  if ('error' in access) return []
  const { supabase } = access

  const { data, error } = await supabase
    .from('EventRegistration')
    .select(`
      id, userId, status, checkedInAt,
      User:User!EventRegistration_userId_fkey ( id, name, email )
    `)
    .eq('eventId', eventId)
    .in('status', ['registered', 'attended'])

  if (error || !data) return []

  const lowered = query.toLowerCase()
  return data
    .map((row) => {
      const attendee = Array.isArray(row.User) ? row.User[0] : row.User
      return {
        registrationId: row.id,
        userId: attendee?.id ?? row.userId,
        name: attendee?.name ?? 'Unknown attendee',
        email: attendee?.email ?? '',
        status: row.status as RegistrationStatus,
        checkedInAt: row.checkedInAt ?? null,
      }
    })
    .filter((row) => row.name.toLowerCase().includes(lowered) || row.email.toLowerCase().includes(lowered))
    .slice(0, 8)
}

export async function checkInAttendee(formData: FormData): Promise<CheckInResponse> {
  const registrationId = String(formData.get('registrationId') ?? '').trim()
  const eventId = String(formData.get('eventId') ?? '').trim()
  if (!registrationId || !eventId) return { error: 'Missing registration data' }

  const access = await assertEventAccess(eventId)
  if ('error' in access) return { error: access.error }
  const { supabase, user, event } = access

  const { data: reg, error: regError } = await supabase
    .from('EventRegistration')
    .select(`
      *,
      User:User!EventRegistration_userId_fkey ( id, name, email )
    `)
    .eq('id', registrationId)
    .maybeSingle()

  if (regError || !reg || reg.eventId !== eventId) return { error: 'Registration not found for this event' }

  const attendee = Array.isArray(reg.User) ? reg.User[0] : reg.User
  const attendeePayload = {
    id: attendee?.id ?? reg.userId,
    name: attendee?.name ?? 'Unknown attendee',
    email: attendee?.email ?? '',
  }

  if (reg.checkedInAt || reg.status === 'attended') {
    const counter = await getCheckInCounter(eventId)
    return {
      success: true,
      state: 'already_checked_in',
      message: 'Already checked in',
      registration: reg as EventRegistrationRow,
      attendee: attendeePayload,
      counter: counter ?? { checkedIn: 0, total: 0 },
    }
  }
  if (reg.status !== 'registered') return { error: 'Not registered for this event' }

  const now = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('EventRegistration')
    .update({
      status: 'attended' as RegistrationStatus,
      checkedInAt: now,
      checkedInById: user.id,
    })
    .eq('id', reg.id)
    .select()
    .single<EventRegistrationRow>()

  if (error || !updated) {
    console.error('[checkInAttendee] Error:', error)
    return { error: 'Failed to check in' }
  }

  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  revalidatePath(`/chapter/events/${event.id}/checkin`)
  revalidatePath('/chapter/checkin')
  const counter = await getCheckInCounter(eventId)
  return {
    success: true,
    state: 'success',
    message: 'Checked in successfully',
    registration: updated,
    attendee: attendeePayload,
    counter: counter ?? { checkedIn: 0, total: 0 },
  }
}

