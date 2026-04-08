'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'

export async function cancelRegistration(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()

  const registrationId = String(formData.get('registrationId') ?? '')
  if (!registrationId) return

  const { data: reg, error: regError } = await supabase
    .from('EventRegistration')
    .select('*')
    .eq('id', registrationId)
    .maybeSingle<EventRegistrationRow>()

  if (regError || !reg) return
  if (reg.userId !== user.id) return
  if (reg.checkedInAt) return
  if (reg.status !== 'registered') return

  const { data: event } = await supabase
    .from('Event')
    .select('*')
    .eq('id', reg.eventId)
    .maybeSingle<EventRow>()

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

