'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'

export type CancelRegistrationResponse =
  | { success: true; registration: EventRegistrationRow }
  | { error: string }

export async function cancelRegistration(formData: FormData): Promise<CancelRegistrationResponse> {
  const { supabase, user } = await requireUser()

  const registrationId = String(formData.get('registrationId') ?? '')
  if (!registrationId) return { error: 'Missing registrationId' }

  const { data: reg, error: regError } = await supabase
    .from('EventRegistration')
    .select('*')
    .eq('id', registrationId)
    .maybeSingle<EventRegistrationRow>()

  if (regError || !reg) return { error: 'Registration not found' }
  if (reg.userId !== user.id) return { error: 'Insufficient permissions' }
  if (reg.checkedInAt) return { error: 'Cannot cancel after check-in' }
  if (reg.status !== 'registered') return { error: 'Registration is not active' }

  const { data: event } = await supabase
    .from('Event')
    .select('*')
    .eq('id', reg.eventId)
    .maybeSingle<EventRow>()

  if (event) {
    const startsAt = new Date(event.startAt).getTime()
    if (Number.isFinite(startsAt) && Date.now() >= startsAt) {
      return { error: 'Cannot cancel after event start' }
    }
  }

  const { data: updated, error } = await supabase
    .from('EventRegistration')
    .update({
      status: 'cancelled' as RegistrationStatus,
    })
    .eq('id', reg.id)
    .select()
    .single<EventRegistrationRow>()

  if (error || !updated) {
    console.error('[cancelRegistration] Error:', error)
    return { error: 'Failed to cancel registration' }
  }

  revalidatePath('/student/events')
  revalidatePath('/events')
  revalidatePath(`/events/${reg.eventId}`)
  return { success: true, registration: updated }
}

