'use server'

import { revalidatePath } from 'next/cache'
import { sendApplicationApprovedEmail } from '@/lib/emails/send-email'
import { sendApplicationRejectedEmail } from '@/lib/emails/send-email'
import { assertCanManageEvent } from './access'
import type { EventRow, EventRegistrationRow, UserRow } from '@/lib/types'

type ApprovedRegistrationRow = Pick<EventRegistrationRow, 'id'> & {
  Applicant: Pick<UserRow, 'email' | 'name'> | null
  CheckedInBy: Pick<UserRow, 'email' | 'name'> | null
  Event: Pick<EventRow, 'title' | 'startAt' | 'location' | 'meetingUrl' | 'eventType'> | null
}

type RejectedRegistrationRow = Pick<EventRegistrationRow, 'id'> & {
  User: Pick<UserRow, 'email' | 'name'> | Pick<UserRow, 'email' | 'name'>[] | null
  Event:
  | (Pick<EventRow, 'title'> & {
    Chapter: { name: string } | { name: string }[] | null
  })
  | Array<
    Pick<EventRow, 'title'> & {
      Chapter: { name: string } | { name: string }[] | null
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
    .from('EventRegistration')
    .select(`
    id,
    Applicant:userId!eventregistration_userid_fkey (
      email,
      name
    ),
    CheckedInBy:checkedInById!eventregistration_checkedinbyid_fkey (
      email,
      name
    ),
    Event:eventId!EventRegistration_eventId_fkey (
      title,
      startAt,
      location,
      meetingUrl,
      eventType
    )
  `)
    .in('id', applicationIds)
    .eq('status', 'registered')

  if (registrations.data) {
    (registrations.data as unknown as ApprovedRegistrationRow[]).forEach((registration) => {


      const user = Array.isArray(registration.Applicant) ? registration.Applicant[0] : registration.Applicant
      const event = Array.isArray(registration.Event) ? registration.Event[0] : registration.Event

      if (user?.email && event?.title) {
        void sendApplicationApprovedEmail(
          user.email,
          user.name,
          event.title,
          new Date(event.startAt).toLocaleString(),
          event.location,
          event.meetingUrl,
          event.eventType,
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
    .from('EventRegistration')
    .update({
      status: 'rejected',
      qrToken: undefined
    })
    .in('id', applicationIds)
    .eq('eventId', eventId)
    .eq('status', 'pending_review')

  if (error) {
    console.error('Bulk reject error:', error)
    throw new Error('Failed to reject applications')
  }

  const { data: registrations } = await supabase
    .from('EventRegistration')
    .select(`
      id,
      User:userId!eventregistration_userid_fkey (email, name),
      Event:eventId (title, Chapter!inner(name))
    `)
    .in('id', applicationIds)
    .eq('status', 'rejected')

  if (registrations) {
    (registrations as unknown as RejectedRegistrationRow[]).forEach((registration) => {
      const user = Array.isArray(registration.User) ? registration.User[0] : registration.User
      const event = Array.isArray(registration.Event) ? registration.Event[0] : registration.Event
      const chapter = event ? (Array.isArray(event.Chapter) ? event.Chapter[0] : event.Chapter) : null

      if (user?.email && event?.title) {
        const chapterName = chapter?.name || 'LEAD Chapter'
        void sendApplicationRejectedEmail(
          user.email,
          user.name,
          event.title,
          chapterName
        ).catch(err => console.error('Failed to send rejection email:', err))
      }
    })
  }

  revalidatePath(`/chapter/events/${eventId}/applications`)
  revalidatePath(`/chapter/events`)

  return { success: true }
}