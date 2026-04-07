'use server'

import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from '@/i18n/routing'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow } from '@/lib/types'

const CAPACITY_MESSAGE =
  'Someone just took the last spot. Check back — cancellations open it back up.'

export type RegisterForEventState = {
  error?: string
  /** True when the DB capacity trigger rejected the insert */
  capacityExceeded?: boolean
}

function isCapacityExceededError(err: { message?: string; details?: string; hint?: string } | null): boolean {
  if (!err) return false
  const blob = `${err.message ?? ''} ${err.details ?? ''} ${err.hint ?? ''}`
  return blob.includes('CAPACITY_EXCEEDED')
}

export async function registerForEvent(
  _prev: RegisterForEventState | null,
  formData: FormData
): Promise<RegisterForEventState> {
  try {
    const { supabase, user } = await requireUser()
    if (!user) {
      return { error: 'You need to sign in to register.' }
    }

    const eventId = String(formData.get('eventId') ?? '')
    if (!eventId) {
      return { error: 'Missing event.' }
    }

    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('*')
      .eq('id', eventId)
      .maybeSingle<EventRow>()

    if (eventError) {
      return { error: 'Could not load this event.' }
    }
    if (!event) {
      return { error: 'Event not found.' }
    }

    if (!event.isPublished) {
      return { error: 'This event is not open for registration.' }
    }

    const startsAt = new Date(event.startAt).getTime()
    if (!Number.isFinite(startsAt)) {
      return { error: 'This event has invalid dates.' }
    }
    if (Date.now() >= startsAt) {
      return { error: 'Registration is closed because the event has already started.' }
    }

    const now = new Date().toISOString()

    const { data: registration, error } = await supabase
      .from('EventRegistration')
      .insert({
        eventId,
        userId: user.id,
        registeredAt: now,
        status: 'registered',
        checkedInAt: null,
        checkedInById: null,
      })
      .select()
      .single<EventRegistrationRow>()

    if (error || !registration) {
      if (isCapacityExceededError(error)) {
        revalidatePath('/events')
        revalidatePath(`/events/${eventId}`)
        revalidatePath('/student/events')
        return { error: CAPACITY_MESSAGE, capacityExceeded: true }
      }
      const msg = (error as { message?: string })?.message?.toLowerCase?.() ?? ''
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return { error: 'You are already registered for this event.' }
      }
      return { error: 'Could not complete registration. Please try again.' }
    }

    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/student/events')

    redirect(`/student/events?event=${eventId}`)
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[registerForEvent]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}
