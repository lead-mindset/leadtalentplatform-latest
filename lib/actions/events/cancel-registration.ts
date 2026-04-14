'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'

const REGISTRATION_SELECT = 'id, eventId, userId, status, checkedInAt'
const EVENT_DATE_SELECT = 'id, startAt'

export async function cancelRegistration(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()

  const registrationId = String(formData.get('registrationId') ?? '')
  if (!registrationId) return

  const { data: reg, error: regError } = await supabase
    .from('EventRegistration')
    .select(REGISTRATION_SELECT)
    .eq('id', registrationId)
    .maybeSingle<Pick<EventRegistrationRow, 'id' | 'eventId' | 'userId' | 'status' | 'checkedInAt'>>()

  if (regError || !reg) return
  if (reg.userId !== user.id) return
  if (reg.checkedInAt) return
  if (reg.status !== 'registered') return

  const { data: event } = await supabase
    .from('Event')
    .select(EVENT_DATE_SELECT)
    .eq('id', reg.eventId)
    .maybeSingle<Pick<EventRow, 'id' | 'startAt'>>()

  if (event) {
    const startsAt = new Date(event.startAt).getTime()
    if (Number.isFinite(startsAt) && Date.now() >= startsAt) {
      return
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
    return
  }

  revalidatePath('/student/events')
  revalidatePath('/events')
  revalidatePath(`/events/${reg.eventId}`)
}

