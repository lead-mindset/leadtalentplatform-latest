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
  if (user.role !== 'editor' && user.role !== 'admin')
    return { supabase, user, error: 'Insufficient permissions' as const }

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

  const checkedIn = data.filter((r) => r.status === 'attended').length
  const total = data.filter((r) => r.status === 'registered' || r.status === 'attended').length

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

  // Filter by both qrToken and eventId in the query to avoid post-fetch mismatch
  const { data: registration, error } = await supabase
    .from('EventRegistration')
    .select('id, eventId, userId, checkedInAt, checkedInById, status')
    .eq('qrToken', token)
    .eq('eventId', eventId)  // ← moved here
    .maybeSingle()

  if (error || !registration) return { ok: false, error: 'Not registered for this event' }

  // Fetch attendee separately to avoid FK hint issues
  const { data: attendeeData } = await supabase
    .from('User')
    .select('id, name, email')
    .eq('id', registration.userId)
    .maybeSingle()

  const attendeePayload = {
    id: attendeeData?.id ?? registration.userId,
    name: attendeeData?.name ?? 'Unknown attendee',
    email: attendeeData?.email ?? 'unknown@email',
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

  const { data: users, error: userError } = await supabase
    .from('User')
    .select('id, name, email')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20)

  if (userError || !users?.length) return []

  const userIds = users.map((u) => u.id)

  const { data, error } = await supabase
    .from('EventRegistration')
    .select('id, userId, status, checkedInAt')
    .eq('eventId', eventId)
    .in('status', ['registered', 'attended'])
    .in('userId', userIds)
    .limit(8)

  if (error || !data) return []

  const userMap = new Map(users.map((u) => [u.id, u]))

  return data.map((row) => {
    const user = userMap.get(row.userId)
    return {
      registrationId: row.id,
      userId: row.userId,
      name: user?.name ?? 'Unknown attendee',
      email: user?.email ?? '',
      status: row.status as RegistrationStatus,
      checkedInAt: row.checkedInAt ?? null,
    }
  })
}

export async function checkInAttendee(formData: FormData): Promise<CheckInResponse> {
  const registrationId = String(formData.get('registrationId') ?? '').trim()
  const eventId = String(formData.get('eventId') ?? '').trim()
  if (!registrationId || !eventId) return { error: 'Missing registration data' }

  const access = await assertEventAccess(eventId)
  if ('error' in access) return { error: access.error }
  const { supabase, user, event } = access

  // Filter by both id and eventId in the query — no post-fetch comparison needed
  const { data: reg, error: regError } = await supabase
    .from('EventRegistration')
    .select('*')
    .eq('id', registrationId)
    .eq('eventId', eventId)  // ← moved here
    .maybeSingle()

  if (regError || !reg) return { error: 'Registration not found for this event' }

  // Fetch attendee separately
  const { data: attendeeData } = await supabase
    .from('User')
    .select('id, name, email')
    .eq('id', reg.userId)
    .maybeSingle()

  const attendeePayload = {
    id: attendeeData?.id ?? reg.userId,
    name: attendeeData?.name ?? 'Unknown attendee',
    email: attendeeData?.email ?? '',
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

  const { data: updated, error: updateError } = await supabase
    .from('EventRegistration')
    .update({
      status: 'attended' as RegistrationStatus,
      checkedInAt: now,
      checkedInById: user.id,
    })
    .eq('id', reg.id)
    .select()
    .single<EventRegistrationRow>()

  if (updateError || !updated) {
    console.error('[checkInAttendee] update error:', updateError)
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