'use server'

import { revalidatePath } from 'next/cache'
import { sendApplicationApprovedEmail } from '@/lib/emails/send-email'
import { sendApplicationRejectedEmail } from '@/lib/emails/send-email'
import { assertCanManageEvent } from './access'
import { EventService } from '@/lib/services/event.service'

export async function bulkApproveApplications(eventId: string, applicationIds: string[]) {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) throw new Error(access.error)
  const { supabase, user } = access

  const { data, error } = await supabase.rpc('bulk_approve_applications', {
    p_event_id: eventId,
    p_application_ids: applicationIds,
    p_approved_by: user.id,
  })

  if (error) {
    throw new Error(error.message || 'Failed to approve applications')
  }

  const result = data as {
    capacity_warning: boolean
    capacity_status: string
    updated_count?: number
  } | null

  if ((result?.updated_count ?? 0) === 0) {
    throw new Error('No pending applications were approved.')
  }

  const capacityWarning = result?.capacity_warning ?? false
  const capacityStatus = result?.capacity_status === 'at_capacity' || result?.capacity_status === 'over_capacity'
    ? result.capacity_status as 'at_capacity' | 'over_capacity'
    : null

  const registrations = await EventService.getApprovedRegistrations(supabase, applicationIds)

  registrations.forEach((registration) => {
    if (registration.applicant?.email && registration.event?.title) {
      void sendApplicationApprovedEmail(
        registration.applicant.email,
        registration.applicant.name ?? 'Student',
        registration.event.title,
        new Date(registration.event.start_at).toLocaleString(),
        registration.event.location,
        registration.event.meeting_url,
        registration.event.event_type,
        registration.id
      ).catch((err: Error) => console.error('Failed to send approval email:', err))
    }
  })

  revalidatePath(`/chapter/events/${eventId}/applications`)
  revalidatePath(`/chapter/events`)
  revalidatePath(`/events/${eventId}`)

  return {
    success: true,
    capacityWarning,
    capacityStatus,
  }
}

export async function bulkRejectApplications(eventId: string, applicationIds: string[]) {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) throw new Error(access.error)
  const { supabase } = access

  const rejectResult = await EventService.bulkRejectApplications(supabase, eventId, applicationIds)
  if (!rejectResult.success) {
    throw new Error(rejectResult.error ?? 'Failed to reject applications')
  }

  const registrations = await EventService.getRejectedRegistrations(supabase, applicationIds)

  registrations.forEach((registration) => {
    if (registration.user?.email && registration.event?.title) {
      const chapter_name = registration.event.chapter?.name || 'LEAD Chapter'
      void sendApplicationRejectedEmail(
        registration.user.email,
        registration.user.name ?? 'Student',
        registration.event.title,
        chapter_name
      ).catch((err: Error) => console.error('Failed to send rejection email:', err))
    }
  })

  revalidatePath(`/chapter/events/${eventId}/applications`)
  revalidatePath(`/chapter/events`)

  return { success: true }
}
