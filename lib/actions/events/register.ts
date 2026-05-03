'use server'

import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
import { sendApplicationReceivedEmail } from '@/lib/emails/send-email'
import type { EventRegistrationRow } from '@/lib/types'

export type RegisterForEventState = {
  error?: string
  /** True when the DB capacity trigger rejected the insert */
  capacityExceeded?: boolean
}

function revalidateEventRegistrationPaths(eventId: string) {
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/student/events')
}

function redirectToStudentEventQr(eventId: string) {
  redirect(`/student/events?event=${eventId}`)
}

export async function applyForEvent(
  eventId: string,
  subscribeToHostChapters = true
): Promise<{ success: true; registration: EventRegistrationRow } | { error: string }> {
  try {
    const { supabase, user } = await requireUser()
    if (!user) {
      return { error: 'You need to sign in to apply.' }
    }

    const result = await EventService.applyForEvent(supabase, eventId, user.id, {
      subscribeToHostChapters,
    })
    if (!result.success) {
      return { error: result.error }
    }

    const { data: eventData } = await supabase
      .from('event')
      .select('title, chapter_id, chapter!inner(name)')
      .eq('id', eventId)
      .single()

    const chapter_name = Array.isArray(eventData?.chapter)
      ? eventData.chapter[0]?.name
      : eventData?.chapter?.name || 'LEAD Chapter'

    if (eventData?.title) {
      void sendApplicationReceivedEmail(
        user.email!,
        user.name || user.email!.split('@')[0],
        eventData.title,
        chapter_name
      ).catch((err: Error) => console.error('Failed to send application received email:', err))
    }

    revalidateEventRegistrationPaths(eventId)
    return { success: true, registration: result.registration }
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
    const subscribeToHostChapters = formData.get('subscribeToHostChapters') !== null

    const validation = await EventService.validateEventForRegistration(supabase, eventId)
    if (!validation.ok) {
      return { error: validation.error }
    }

    const result = await EventService.registerForEvent(supabase, eventId, user.id, {
      subscribeToHostChapters,
    })
    if (!result.success) {
      revalidateEventRegistrationPaths(eventId)
      return { error: result.error, capacityExceeded: result.capacityExceeded }
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
