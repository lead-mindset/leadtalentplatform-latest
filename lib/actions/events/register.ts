'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow } from '@/lib/types'

export type RegisterResponse =
  | { success: true; registration: EventRegistrationRow }
  | { error: string }

export async function registerForEvent(formData: FormData): Promise<RegisterResponse> {
  const { supabase, user } = await requireUser()

  const eventId = String(formData.get('eventId') ?? '')
  if (!eventId) return { error: 'Missing eventId' }

  const { data: event, error: eventError } = await supabase
    .from('Event')
    .select('*')
    .eq('id', eventId)
    .maybeSingle<EventRow>()

  if (eventError || !event) return { error: 'Event not found' }
  if (!event.isPublished) return { error: 'Event is not published' }

  const startsAt = new Date(event.startAt).getTime()
  if (!Number.isFinite(startsAt)) return { error: 'Invalid event start time' }
  if (Date.now() >= startsAt) return { error: 'Registration closed' }

  const now = new Date().toISOString()
  const qrToken = crypto.randomUUID()

  const { data: registration, error } = await supabase
    .from('EventRegistration')
    .insert({
      eventId,
      userId: user.id,
      registeredAt: now,
      status: 'registered',
      qrToken,
      checkedInAt: null,
      checkedInById: null,
    })
    .select()
    .single<EventRegistrationRow>()

  if (error || !registration) {
    const msg = (error as any)?.message?.toLowerCase?.() ?? ''
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return { error: 'You are already registered for this event' }
    }
    return { error: 'Failed to register' }
  }

  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/student/events')
  return { success: true, registration }
}

