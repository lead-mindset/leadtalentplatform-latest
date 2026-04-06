'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow } from '@/lib/types'

export type RegisterResponse =
  | { success: true; registration: EventRegistrationRow }
  | { error: string }

export async function registerForEvent(formData: FormData): Promise<RegisterResponse> {
  try {
    const { supabase, user } = await requireUser()
    if (!user) {
      console.error('[registerForEvent] No user returned from requireUser()')
      return { error: 'User not logged in' }
    }
    console.log('[registerForEvent] Logged in user:', user)

    // 2️⃣ Get eventId from form
    const eventId = String(formData.get('eventId') ?? '')
    if (!eventId) {
      console.error('[registerForEvent] Missing eventId in formData')
      return { error: 'Missing eventId' }
    }
    console.log('[registerForEvent] Event ID:', eventId)

    // 3️⃣ Fetch the event
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('*')
      .eq('id', eventId)
      .maybeSingle<EventRow>()

    if (eventError) {
      console.error('[registerForEvent] Supabase error fetching Event:', eventError)
      return { error: 'Failed to fetch event' }
    }
    if (!event) {
      console.error('[registerForEvent] Event not found for ID:', eventId)
      return { error: 'Event not found' }
    }
    console.log('[registerForEvent] Event fetched:', event)

    if (!event.isPublished) {
      console.warn('[registerForEvent] Event is not published:', eventId)
      return { error: 'Event is not published' }
    }

    // 4️⃣ Check registration timing
    const startsAt = new Date(event.startAt).getTime()
    if (!Number.isFinite(startsAt)) {
      console.error('[registerForEvent] Invalid event start time:', event.startAt)
      return { error: 'Invalid event start time' }
    }
    if (Date.now() >= startsAt) {
      console.warn('[registerForEvent] Registration closed for event:', eventId)
      return { error: 'Registration closed' }
    }

const now = new Date().toISOString()
const qrToken = crypto.randomUUID()

const insertData = {
  eventId,
  userId: user.id,
  registeredAt: now,
  status: 'registered',
  qrToken,
  checkedInAt: null,
  checkedInById: null
}

const { data: registration, error } = await supabase
  .from('EventRegistration')
  .insert(insertData)
  .select()
  .single<EventRegistrationRow>()

    console.log('[registerForEvent] Supabase insert response:', { registration, error })

    if (error || !registration) {
      const msg = (error as any)?.message?.toLowerCase?.() ?? ''
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return { error: 'You are already registered for this event' }
      }
      return { error: 'Failed to register' }
    }

    // 7️⃣ Revalidate paths to update UI
    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/student/events')

    return { success: true, registration }

  } catch (err) {
    console.error('[registerForEvent] Unexpected error:', err)
    return { error: 'Unexpected error' }
  }
}