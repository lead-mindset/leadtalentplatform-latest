'use server'

import { revalidatePath } from 'next/cache'
import type { EventRegistrationRow, RegistrationStatus, UserRow } from '@/lib/types'
import { assertCanManageEvent } from './access'

const CHECKIN_REGISTRATION_SELECT =
  'id, event_id, user_id, registered_at, status, qr_token, checked_in_at, checked_in_by_id'

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

type StatusOnlyRow = Pick<EventRegistrationRow, 'status'>
type SearchUserRow = Pick<UserRow, 'id' | 'name' | 'email'>
type SearchRegistrationRow = Pick<EventRegistrationRow, 'id' | 'user_id' | 'status' | 'checked_in_at'>

async function assertEventAccess(eventId: string) {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) {
    return { error: access.error }
  }

  return access
}

export async function getCheckInCounter(eventId: string): Promise<CheckInCounter | null> {
  const access = await assertEventAccess(eventId)
  if ('error' in access) return null
  const { supabase } = access

  const { data, error } = await supabase
    .from('event_registration')
    .select('status')
    .eq('event_id', eventId)

  if (error || !data) return null

  const rows = data as StatusOnlyRow[]
  const checkedIn = rows.filter((registration) => registration.status === 'attended').length
  const total = rows.filter((registration) => registration.status === 'registered' || registration.status === 'attended').length

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
    .from('event_registration')
    .select('id, event_id, user_id, checked_in_at, checked_in_by_id, status')
    .eq('qr_token', token)
    .eq('event_id', eventId)  // ← moved here
    .maybeSingle()

  if (error || !registration) return { ok: false, error: 'Not registered for this event' }

  // Fetch attendee separately to avoid FK hint issues
  const { data: attendeeData } = await supabase
    .from('user')
    .select('id, name, email')
    .eq('id', registration.user_id)
    .maybeSingle()

  const attendeePayload = {
    id: attendeeData?.id ?? registration.user_id,
    name: attendeeData?.name ?? 'Unknown attendee',
    email: attendeeData?.email ?? 'unknown@email',
  }

  if (registration.checked_in_at || registration.status === 'attended') {
    let checkedInByName: string | null = null
    if (registration.checked_in_by_id) {
      const { data: checker } = await supabase
        .from('user')
        .select('name')
        .eq('id', registration.checked_in_by_id)
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
    .from('user')
    .select('id, name, email')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20)

  if (userError || !users?.length) return []

  const matchedUsers = users as SearchUserRow[]
  const userIds = matchedUsers.map((matchedUser) => matchedUser.id)

  const { data, error } = await supabase
    .from('event_registration')
    .select('id, user_id, status, checked_in_at')
    .eq('event_id', eventId)
    .in('status', ['registered', 'attended'])
    .in('user_id', userIds)
    .limit(8)

  if (error || !data) return []

  const userMap = new Map(matchedUsers.map((matchedUser) => [matchedUser.id, matchedUser]))

return (data as SearchRegistrationRow[]).map((registration) => {
    const user = userMap.get(registration.user_id)
    return {
      registrationId: registration.id,
      userId: registration.user_id,
      name: user?.name ?? 'Unknown attendee',
      email: user?.email ?? '',
      status: registration.status as RegistrationStatus,
      checkedInAt: registration.checked_in_at ?? null,
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
    .from('event_registration')
    .select(CHECKIN_REGISTRATION_SELECT)
    .eq('id', registrationId)
    .eq('event_id', eventId)  // ← moved here
    .maybeSingle()

  if (regError || !reg) return { error: 'Registration not found for this event' }

  // Fetch attendee separately
  const { data: attendeeData } = await supabase
    .from('user')
    .select('id, name, email')
    .eq('id', reg.userId)
    .maybeSingle()

  const attendeePayload = {
    id: attendeeData?.id ?? reg.user_id,
    name: attendeeData?.name ?? 'Unknown attendee',
    email: attendeeData?.email ?? '',
  }

  if (reg.checked_in_at || reg.status === 'attended') {
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
    .from('event_registration')
    .update({
      status: 'attended' as RegistrationStatus,
      checked_in_at: now,
      checked_in_by_id: user.id,
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
