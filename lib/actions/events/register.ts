'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'
import { sendApplicationReceivedEmail } from '@/lib/emails/send-email'

const EVENT_REGISTRATION_LOOKUP_SELECT =
  'id, title, isPublished, startAt'

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
      .from('EventRegistration')
      .insert({
        eventId,
        userId: user.id,
        registeredAt: now,
        status: 'pending_review' as RegistrationStatus,
        qrToken: null,
        checkedInAt: null,
        checkedInById: null,
      })
      .select()
      .single<EventRegistrationRow>()

    if (error || !registration) {
      console.error('[applyForEvent] Error:', error)
      return { error: 'Could not submit application. Please try again.' }
    }

    const { data: eventData } = await supabase
      .from('Event')
      .select('title, chapterId, Chapter!inner(name)')
      .eq('id', eventId)
      .single()

    const chapterName = eventData?.Chapter?.[0]?.name || 'LEAD Chapter'

    if (eventData?.title) {
      void sendApplicationReceivedEmail(
        user.email!,
        user.name || user.email!.split('@')[0],
        eventData.title,
        chapterName
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
      .from('Event')
      .select(EVENT_REGISTRATION_LOOKUP_SELECT)
      .eq('id', eventId)
      .maybeSingle<Pick<EventRow, 'id' | 'title' | 'isPublished' | 'startAt'>>()

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

    const { data: existing, error: existingError } = await supabase
      .from('EventRegistration')
      .select('id, status')
      .eq('eventId', eventId)
      .eq('userId', user.id)
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
          .from('EventRegistration')
          .update({
            status: 'registered' as RegistrationStatus,
            registeredAt: now,
            qrToken: randomUUID(),
            checkedInAt: null,
            checkedInById: null,
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
      .from('EventRegistration')
      .insert({
        eventId,
        userId: user.id,
        registeredAt: now,
        status: 'registered',
        qrToken: randomUUID(),
        checkedInAt: null,
        checkedInById: null,
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
          .from('EventRegistration')
          .select('id, status')
          .eq('eventId', eventId)
          .eq('userId', user.id)
          .maybeSingle<{ id: string; status: RegistrationStatus }>()

        if (row && isActiveRegistrationStatus(row.status)) {
          revalidateEventRegistrationPaths(eventId)
          redirectToStudentEventQr(eventId)
        }
        if (row?.status === 'cancelled') {
          const { data: revived, error: reviveError } = await supabase
            .from('EventRegistration')
            .update({
              status: 'registered' as RegistrationStatus,
              registeredAt: now,
              qrToken: randomUUID(),
              checkedInAt: null,
              checkedInById: null,
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
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[registerForEvent]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}
