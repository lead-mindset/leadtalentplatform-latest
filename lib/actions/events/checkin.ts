'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getEditorChapterId } from './get-data'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'

export type CheckInResponse =
  | { success: true; registration: EventRegistrationRow }
  | { error: string }

export async function checkInAttendee(formData: FormData): Promise<CheckInResponse> {
  const { supabase, user } = await requireUser()
  if (user.role !== 'editor' && user.role !== 'admin') {
    return { error: 'Insufficient permissions' }
  }

  const token = String(formData.get('qrToken') ?? '').trim()
  if (!token) return { error: 'Missing token' }

  const { data: reg, error: regError } = await supabase
    .from('EventRegistration')
    .select('*')
    .eq('qrToken', token)
    .maybeSingle<EventRegistrationRow>()

  if (regError || !reg) return { error: 'Invalid token' }
  if (reg.checkedInAt) return { error: 'Already checked in' }

  const { data: event, error: eventError } = await supabase
    .from('Event')
    .select('*')
    .eq('id', reg.eventId)
    .maybeSingle<EventRow>()

  if (eventError || !event) return { error: 'Event not found' }

  if (user.role === 'editor') {
    const chapterId = await getEditorChapterId()
    if (!chapterId) return { error: 'No chapter assigned' }
    if (event.chapterId !== chapterId) return { error: 'Insufficient permissions' }
  }

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
  return { success: true, registration: updated }
}

