import { Suspense } from 'react'
import { Navbar } from '../../(public)/_components/navbar'
import { getEventById } from '@/lib/actions/events/get-data'
import { createClient } from '@/lib/supabase/server'
import { EventContent } from './_components/EventContent'
import type { EventApplicationQuestionRow } from '@/lib/types'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { getEventOnboardingPath } from '@/lib/actions/events/register.helpers'
import { EventService } from '@/lib/services/event.service'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const event = await getEventById(id)
  const { data: applicationQuestions } = await supabase
    .from('event_application_question')
    .select('*')
    .eq('event_id', id)
    .order('sort_order', { ascending: true })

  let myRegistration = null
  let hasBasicProfile = false
  let registrationBlockedReason: string | null = null
  if (auth.user && event) {
    const [profile, { data }, eligibility] = await Promise.all([
      PersonProfileService.getBasicProfile(supabase, auth.user.id),
      supabase
        .from('event_registration')
        .select('id, status, checked_in_at')
        .eq('event_id', event.id)
        .eq('user_id', auth.user.id)
        .maybeSingle(),
      EventService.validateUserEventRegistrationEligibility(supabase, event.id, auth.user.id),
    ])
    hasBasicProfile = Boolean(profile)
    myRegistration = data ?? null
    registrationBlockedReason = eligibility.success ? null : eligibility.error
  }

  const serializedEvent = event ? JSON.parse(JSON.stringify(event)) : null
  const serializedRegistration = myRegistration ? JSON.parse(JSON.stringify(myRegistration)) : null
  const serializedApplicationQuestions = JSON.parse(
    JSON.stringify((applicationQuestions ?? []) as EventApplicationQuestionRow[])
  )

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <EventContent
        event={serializedEvent}
        myRegistration={serializedRegistration}
        applicationQuestions={serializedApplicationQuestions}
        isLoggedIn={!!auth.user}
        hasBasicProfile={hasBasicProfile}
        onboardingUrl={getEventOnboardingPath(id)}
        registrationBlockedReason={registrationBlockedReason}
      />
    </>
  )
}
