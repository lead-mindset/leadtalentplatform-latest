'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'
import { sendApplicationReceivedEmail } from '@/lib/emails/send-email'

const EVENT_REGISTRATION_LOOKUP_SELECT =
  'id, title, is_published, start_at'

function isActiveRegistrationStatus(status: RegistrationStatus | string | undefined): boolean {
  return status === 'registered' || status === 'attended'
}

function revalidateEventRegistrationPaths(eventId: string) {
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/student/events')
}

function redirectToStudentEventQr(eventId: string) {
  redirect(`/student/events?event=${eventId}`)
}

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

export async function applyForEvent(eventId: string): Promise<{ success: true; registration: EventRegistrationRow } | { error: string }> {
  try {
    const { supabase, user } = await requireUser()
    if (!user) {
      return { error: 'You need to sign in to apply.' }
    }

    const now = new Date().toISOString()

    const { data: registration, error } = await supabase
      .from('event_registration')
      .insert({
        event_id: eventId,
        user_id: user.id,
        registered_at: now,
        status: 'pending_review' as RegistrationStatus,
        qr_token: null,
        checked_in_at: null,
        checked_in_by_id: null,
      })
      .select()
      .single<EventRegistrationRow>()

    if (error || !registration) {
      console.error('[applyForEvent] Error:', error)
      return { error: 'Could not submit application. Please try again.' }
    }

    const { data: eventData } = await supabase
      .from('event')
      .select('title, chapter_id, chapter!inner(name)')
      .eq('id', eventId)
      .single()

    const chapter_name = Array.isArray(eventData?.chapter) ? eventData.chapter[0]?.name : eventData?.chapter?.name || 'LEAD Chapter'

    if (eventData?.title) {
      void sendApplicationReceivedEmail(
        user.email!,
        user.name || user.email!.split('@')[0],
        eventData.title,
        chapter_name
      ).catch(err => console.error('Failed to send application received email:', err))
    }

    revalidateEventRegistrationPaths(eventId)
    return { success: true, registration }
  } catch (err) {
    console.error('[applyForEvent]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
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
      .from('event')
      .select(EVENT_REGISTRATION_LOOKUP_SELECT)
      .eq('id', eventId)
      .maybeSingle<Pick<EventRow, 'id' | 'title' | 'is_published' | 'start_at'>>()

    if (eventError) {
      return { error: 'Could not load this event.' }
    }
    if (!event) {
      return { error: 'Event not found.' }
    }

    if (!event.is_published) {
      return { error: 'This event is not open for registration.' }
    }

    const starts_at = new Date(event.start_at).getTime()
    if (!Number.isFinite(starts_at)) {
      return { error: 'This event has invalid dates.' }
    }
    if (Date.now() >= starts_at) {
      return { error: 'Registration is closed because the event has already started.' }
    }

    const now = new Date().toISOString()

    const { data: existing, error: existingError } = await supabase
      .from('event_registration')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle<{ id: string; status: RegistrationStatus }>()

    if (existingError) {
      console.error('[registerForEvent] existing lookup:', existingError)
    }

    if (existing) {
      if (isActiveRegistrationStatus(existing.status)) {
        revalidateEventRegistrationPaths(eventId)
        redirectToStudentEventQr(eventId)
      }
      if (existing.status === 'cancelled') {
        const { data: revived, error: reviveError } = await supabase
          .from('event_registration')
          .update({
            status: 'registered' as RegistrationStatus,
            registered_at: now,
            qr_token: randomUUID(),
            checked_in_at: null,
            checked_in_by_id: null,
          })
          .eq('id', existing.id)
          .select()
          .single<EventRegistrationRow>()

        if (!reviveError && revived) {
          revalidateEventRegistrationPaths(eventId)
          redirectToStudentEventQr(eventId)
        }
        console.error('[registerForEvent] re-register after cancel failed:', reviveError)
        return { error: 'Could not complete registration. Please try again.' }
      }
    }

    const { data: registration, error } = await supabase
      .from('event_registration')
      .insert({
        event_id: eventId,
        user_id: user.id,
        registered_at: now,
        status: 'registered',
        qr_token: randomUUID(),
        checked_in_at: null,
        checked_in_by_id: null,
      })
      .select()
      .single<EventRegistrationRow>()

    if (error || !registration) {
      if (isCapacityExceededError(error)) {
        revalidateEventRegistrationPaths(eventId)
        return { error: CAPACITY_MESSAGE, capacityExceeded: true }
      }
      const msg = (error as { message?: string })?.message?.toLowerCase?.() ?? ''
      if (msg.includes('duplicate') || msg.includes('unique')) {
        const { data: row } = await supabase
          .from('event_registration')
          .select('id, status')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .maybeSingle<{ id: string; status: RegistrationStatus }>()

        if (row && isActiveRegistrationStatus(row.status)) {
          revalidateEventRegistrationPaths(eventId)
          redirectToStudentEventQr(eventId)
        }
        if (row?.status === 'cancelled') {
          const { data: revived, error: reviveError } = await supabase
          .from('event_registration')
          .update({
            status: 'registered' as RegistrationStatus,
            registered_at: now,
            qr_token: randomUUID(),
            checked_in_at: null,
            checked_in_by_id: null,
          })
          .eq('id', row.id)
          .select()
          .single<EventRegistrationRow>()

          if (!reviveError && revived) {
            revalidateEventRegistrationPaths(eventId)
            redirectToStudentEventQr(eventId)
          }
        }
        return { error: 'You are already registered for this event.' }
      }
      console.error('[registerForEvent] insert failed:', error)
      return { error: 'Could not complete registration. Please try again.' }
    }

    revalidateEventRegistrationPaths(eventId)

    redirectToStudentEventQr(eventId)
    
    return { error: 'Something went wrong. Please try again.' }
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[registerForEvent]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}
