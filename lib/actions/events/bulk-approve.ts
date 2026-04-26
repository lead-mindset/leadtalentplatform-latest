'use server'

import { revalidatePath } from 'next/cache'
import { sendApplicationApprovedEmail } from '@/lib/emails/send-email'
import { sendApplicationRejectedEmail } from '@/lib/emails/send-email'
import { assertCanManageEvent } from './access'
import type { EventRow, EventRegistrationRow, UserRow } from '@/lib/types'

type ApprovedRegistrationRow = Pick<EventRegistrationRow, 'id'> & {
  applicant: Pick<UserRow, 'email' | 'name'> | null
  checked_in_by: Pick<UserRow, 'email' | 'name'> | null
  event: Pick<EventRow, 'title' | 'start_at' | 'location' | 'meeting_url' | 'event_type'> | null
}

type RejectedRegistrationRow = Pick<EventRegistrationRow, 'id'> & {
  user: Pick<UserRow, 'email' | 'name'> | Pick<UserRow, 'email' | 'name'>[] | null
  event:
  | (Pick<EventRow, 'title'> & {
    chapter: { name: string } | { name: string }[] | null
  })
  | Array<
    Pick<EventRow, 'title'> & {
      chapter: { name: string } | { name: string }[] | null
    }
  >
  | null
}

export async function bulkApproveApplications(eventId: string, applicationIds: string[]) {
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) throw new Error(access.error)
  const { supabase, user } = access

  const { data, error } = await supabase.rpc('bulk_approve_applications', {
    p_event_id: eventId,
    p_application_ids: applicationIds,
    p_approved_by: user.id,
  })

  const result = data as { capacity_warning: boolean; capacity_status: string } | null

  const capacityWarning = result?.capacity_warning ?? false
  const capacityStatus = result?.capacity_status === 'at_capacity' || result?.capacity_status === 'over_capacity' 
    ? result.capacity_status as 'at_capacity' | 'over_capacity'
    : null

  const registrations = await supabase
    .from('event_registration')
    .select(`
    id,
    applicant:user!event_registration_user_id_fkey (
      email,
      name
    ),
    checked_in_by:user!event_registration_checked_in_by_id_fkey (
      email,
      name
    ),
    event:event!event_registration_event_id_fkey (
      title,
      start_at,
      location,
      meeting_url,
      event_type
    )
  `)
    .in('id', applicationIds)
    .eq('status', 'registered')

  if (registrations.data) {
    (registrations.data as unknown as ApprovedRegistrationRow[]).forEach((registration) => {


      const user = Array.isArray(registration.applicant) ? registration.applicant[0] : registration.applicant
      const event = Array.isArray(registration.event) ? registration.event[0] : registration.event

      if (user?.email && event?.title) {
        void sendApplicationApprovedEmail(
          user.email,
          user.name,
          event.title,
          new Date(event.start_at).toLocaleString(),
          event.location,
          event.meeting_url,
          event.event_type,
          registration.id
        ).catch(err => console.error('Failed to send approval email:', err))
      }
    })
  }

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

  const { error } = await supabase
    .from('event_registration')
    .update({
      status: 'rejected',
      qr_token: undefined
    })
    .in('id', applicationIds)
    .eq('event_id', eventId)
    .eq('status', 'pending_review')

  if (error) {
    console.error('Bulk reject error:', error)
    throw new Error('Failed to reject applications')
  }

  const { data: registrations } = await supabase
    .from('event_registration')
    .select(`
      id,
      user:user!event_registration_user_id_fkey (email, name),
      event:event!event_registration_event_id_fkey (title, chapter!inner(name))
    `)
    .in('id', applicationIds)
    .eq('status', 'rejected')

  if (registrations) {
    (registrations as unknown as RejectedRegistrationRow[]).forEach((registration) => {
      const user = Array.isArray(registration.user) ? registration.user[0] : registration.user
      const event = Array.isArray(registration.event) ? registration.event[0] : registration.event
      const chapter = event ? (Array.isArray(event.chapter) ? event.chapter[0] : event.chapter) : null

      if (user?.email && event?.title) {
        const chapter_name = chapter?.name || 'LEAD Chapter'
        void sendApplicationRejectedEmail(
          user.email,
          user.name,
          event.title,
          chapter_name
        ).catch(err => console.error('Failed to send rejection email:', err))
      }
    })
  }

  revalidatePath(`/chapter/events/${eventId}/applications`)
  revalidatePath(`/chapter/events`)

  return { success: true }
}