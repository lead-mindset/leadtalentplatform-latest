'use server'

import { revalidatePath } from 'next/cache'
import {
  EventService,
  type CheckInCounter,
  type CheckInCandidate,
  type CheckInResponse,
  type CheckInSearchResult,
} from '@/lib/services/event.service'
import { assertCanManageEvent } from './access'

type CheckInState = 'success' | 'already_checked_in' | 'not_registered'

export type { CheckInCounter, CheckInCandidate, CheckInResponse, CheckInSearchResult }

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

  return EventService.getCheckInCounter(supabase, eventId)
}

export async function resolveCheckInCandidate(formData: FormData): Promise<CheckInCandidate> {
  const token = String(formData.get('qrToken') ?? '').trim()
  const eventId = String(formData.get('eventId') ?? '').trim()
  if (!token) return { ok: false, error: 'Missing token' }
  if (!eventId) return { ok: false, error: 'Select an event first' }

  const access = await assertEventAccess(eventId)
  if ('error' in access) return { ok: false, error: access.error }
  const { supabase } = access

  return EventService.resolveCheckInCandidate(supabase, eventId, token)
}

export async function searchAttendeesForCheckIn(formData: FormData): Promise<CheckInSearchResult[]> {
  const eventId = String(formData.get('eventId') ?? '').trim()
  const query = String(formData.get('query') ?? '').trim()
  if (!eventId || query.length < 2) return []

  const access = await assertEventAccess(eventId)
  if ('error' in access) return []
  const { supabase } = access

  return EventService.searchAttendeesForCheckIn(supabase, eventId, query)
}

export async function checkInAttendee(formData: FormData): Promise<CheckInResponse> {
  const registrationId = String(formData.get('registrationId') ?? '').trim()
  const eventId = String(formData.get('eventId') ?? '').trim()
  if (!registrationId || !eventId) return { error: 'Missing registration data' }

  const access = await assertEventAccess(eventId)
  if ('error' in access) return { error: access.error }
  const { supabase, user, event } = access

  const result = await EventService.checkInAttendee(supabase, registrationId, eventId, user.id)
  if ('error' in result) {
    return result
  }

  revalidatePath('/chapter/events')
  revalidatePath('/admin/events')
  revalidatePath(`/chapter/events/${event.id}/checkin`)
  revalidatePath('/chapter/checkin')

  return result
}
