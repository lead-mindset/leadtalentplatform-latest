'use server'

import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { EventService } from '@/lib/services/event.service'
import { sendApplicationReceivedEmail, sendEventRegistrationConfirmedEmail } from '@/lib/emails/send-email'
import type { EventRegistrationRow } from '@/lib/types'
import { getEventRegistrationPreflight } from '@/lib/actions/events/register.helpers'

const ApplicationAnswerSchema = z.object({
  questionId: z.string().uuid(),
  value: z.union([z.string(), z.array(z.string())]).nullable().optional(),
})

const SUPPORTED_LOCALES = new Set(['en', 'es'])

export type RegisterForEventState = {
  error?: string
  /** True when the DB capacity trigger rejected the insert */
  capacityExceeded?: boolean
  requiresOnboarding?: boolean
  onboardingPath?: string
}

function revalidateEventRegistrationPaths(eventId: string) {
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/student/events')
}

async function getRequestLocale() {
  const referer = (await headers()).get('referer')
  if (!referer) return 'es'

  try {
    const locale = new URL(referer).pathname.split('/').filter(Boolean)[0]
    return SUPPORTED_LOCALES.has(locale) ? locale : 'es'
  } catch {
    return 'es'
  }
}

function redirectToStudentEventQr(eventId: string, locale: string) {
  redirect(`/${locale}/student/events?event=${eventId}`)
}

export async function applyForEvent(
  eventId: string,
  subscribeToHostChapters = true,
  applicationAnswers: unknown[] = []
): Promise<
  | { success: true; registration: EventRegistrationRow }
  | { error: string; requiresOnboarding?: boolean; onboardingPath?: string }
> {
  try {
    const parsedAnswers = z.array(ApplicationAnswerSchema).safeParse(applicationAnswers)
    if (!parsedAnswers.success) {
      return { error: 'Application answers are invalid.' }
    }

    const { supabase, user } = await requireUser()
    if (!user) {
      return { error: 'You need to sign in to apply.' }
    }

    const preflight = await getEventRegistrationPreflight(supabase, { userId: user.id, eventId })
    if (!preflight.ok) {
      return {
        error: preflight.error,
        requiresOnboarding: true,
        onboardingPath: preflight.onboardingPath,
      }
    }

    const result = await EventService.applyForEvent(supabase, eventId, user.id, {
      subscribeToHostChapters,
      applicationAnswers: parsedAnswers.data.map((answer) => ({
        questionId: answer.questionId,
        value: answer.value ?? null,
      })),
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

    const locale = await getRequestLocale()

    if (eventData?.title) {
      void sendApplicationReceivedEmail(
        user.email!,
        user.name || user.email!.split('@')[0],
        eventData.title,
        chapter_name,
        locale as 'en' | 'es'
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
  const locale = await getRequestLocale()

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

    const preflight = await getEventRegistrationPreflight(supabase, { userId: user.id, eventId })
    if (!preflight.ok) {
      return {
        error: preflight.error,
        requiresOnboarding: true,
        onboardingPath: preflight.onboardingPath,
      }
    }

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

    const { data: eventData } = await supabase
      .from('event')
      .select('title, start_at, location, meeting_url, event_type')
      .eq('id', eventId)
      .single()

    if (eventData?.title) {
      void sendEventRegistrationConfirmedEmail(user.email!, {
        name: user.name,
        eventTitle: eventData.title,
        eventDate: new Date(eventData.start_at).toLocaleString(),
        eventLocation: eventData.location,
        meetingUrl: eventData.meeting_url,
        eventType: eventData.event_type,
        locale: locale as 'en' | 'es',
      }).catch((error: Error) => console.error('Failed to send event registration email:', error))
    }

    revalidateEventRegistrationPaths(eventId)
    redirectToStudentEventQr(eventId, locale)

    return { error: 'Something went wrong. Please try again.' }
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[registerForEvent]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}
