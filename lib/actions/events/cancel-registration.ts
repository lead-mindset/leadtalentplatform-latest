'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'

const REGISTRATION_SELECT = 'id, event_id, user_id, status, checked_in_at'
const EVENT_DATE_SELECT = 'id, start_at'

export async function cancelRegistration(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()

  const registrationId = String(formData.get('registrationId') ?? '')
  if (!registrationId) return

  const { data: reg, error: regError } = await supabase
    .from('event_registration')
    .select(REGISTRATION_SELECT)
    .eq('id', registrationId)
.maybeSingle<Pick<EventRegistrationRow, 'id' | 'event_id' | 'user_id' | 'status' | 'checked_in_at'>>()

  if (regError || !reg) return
  if (reg.user_id !== user.id) return
  if (reg.checked_in_at) return
  if (reg.status !== 'registered') return

  const { data: event } = await supabase
    .from('event')
    .select(EVENT_DATE_SELECT)
    .eq('id', reg.event_id)
    .maybeSingle<Pick<EventRow, 'id' | 'startAt'>>()

  if (event) {
    const startsAt = new Date(event.startAt).getTime()
    if (Number.isFinite(startsAt) && Date.now() >= startsAt) {
      return
    }
  }

  const { data: updated, error } = await supabase
    .from('event_registration')
    .update({
      status: 'cancelled' as RegistrationStatus,
    })
    .eq('id', reg.id)
    .select()
    .single<EventRegistrationRow>()

  if (error || !updated) {
    console.error('[cancelRegistration] Error:', error)
    return
  }

  revalidatePath('/student/events')
  revalidatePath('/events')
  revalidatePath(`/events/${reg.eventId}`)
}

