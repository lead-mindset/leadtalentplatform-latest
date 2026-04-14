import { Suspense } from 'react'
import { Navbar } from '../../(public)/_components/navbar'
import { getEventById } from '@/lib/actions/events/get-data'
import { createClient } from '@/lib/supabase/server'
import { EventContent } from './_components/EventContent'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const event = await getEventById(id)

  let myRegistration = null
  if (auth.user && event) {
    const { data } = await supabase
      .from('EventRegistration')
      .select('id, status, checkedInAt')
      .eq('eventId', event.id)
      .eq('userId', auth.user.id)
      .maybeSingle()
    myRegistration = data ?? null
  }

  const serializedEvent = event ? JSON.parse(JSON.stringify(event)) : null
  const serializedRegistration = myRegistration ? JSON.parse(JSON.stringify(myRegistration)) : null

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <EventContent
        event={serializedEvent}
        myRegistration={serializedRegistration}
        isLoggedIn={!!auth.user}
      />
    </>
  )
}