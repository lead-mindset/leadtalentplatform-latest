import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { PersonProfileService } from '@/lib/services/person-profile.service'

export type EventRegistrationPreflight =
  | { ok: true }
  | {
      ok: false
      reason: 'missing_profile'
      error: string
      onboardingPath: string
    }

export function getEventOnboardingPath(eventId: string) {
  return `/onboarding?next=${encodeURIComponent(`/events/${eventId}`)}`
}

export async function getEventRegistrationPreflight(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    eventId: string
  }
): Promise<EventRegistrationPreflight> {
  const profile = await PersonProfileService.getBasicProfile(supabase, params.userId)

  if (!profile) {
    return {
      ok: false,
      reason: 'missing_profile',
      error: 'Complete onboarding before registering for this event.',
      onboardingPath: getEventOnboardingPath(params.eventId),
    }
  }

  return { ok: true }
}
