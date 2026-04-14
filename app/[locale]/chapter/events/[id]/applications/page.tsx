import { notFound } from 'next/navigation'
import { getEventRegistrations } from '@/lib/actions/events/get-data'
import { assertCanManageEvent } from '@/lib/actions/events/access'
import { EventApplicationsClient } from './_components/event-applications-client'

export default async function EventApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const access = await assertCanManageEvent(id)

  if ('error' in access) {
    if (access.error === 'Event not found') {
      notFound()
    }

    throw new Error(access.error)
  }

  const applications = await getEventRegistrations(id)

  return (
    <EventApplicationsClient
      event={access.event}
      initialApplications={applications}
    />
  )
}
