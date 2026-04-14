'use server'

import { revalidatePath } from 'next/cache'
import { sendApplicationApprovedEmail } from '@/lib/emails/send-email'
import { sendApplicationRejectedEmail } from '@/lib/emails/send-email'
import { assertCanManageEvent } from './access'

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
    console.error('Bulk approve error:', error)
    throw new Error('Failed to approve applications')
  }

  const capacityWarning = data?.capacity_warning || false
  const capacityStatus = data?.capacity_status || 'ok'

  const { data: registrations } = await supabase
    .from('EventRegistration')
    .select(`
      id,
      User:userId (email, name),
      Event:eventId (title, startAt, location, meetingUrl, eventType)
    `)
    .in('id', applicationIds)
    .eq('status', 'registered')

  if (registrations) {
    registrations.forEach((registration: any) => {
      if (registration.User?.email && registration.Event?.title) {
        void sendApplicationApprovedEmail(
          registration.User.email,
          registration.User.name,
          registration.Event.title,
          new Date(registration.Event.startAt).toLocaleString(),
          registration.Event.location,
          registration.Event.meetingUrl,
          registration.Event.eventType,
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
      qrToken: null
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
      User:userId (email, name),
      Event:eventId (title, Chapter!inner(name))
    `)
    .in('id', applicationIds)
    .eq('status', 'rejected')

  if (registrations) {
    registrations.forEach((registration: any) => {
      if (registration.User?.email && registration.Event?.title) {
        const chapterName = registration.Event?.Chapter?.[0]?.name || 'LEAD Chapter'
        void sendApplicationRejectedEmail(
          registration.User.email,
          registration.User.name,
          registration.Event.title,
          chapterName
        ).catch(err => console.error('Failed to send rejection email:', err))
      }
    })
  }

  revalidatePath(`/chapter/events/${eventId}/applications`)
  revalidatePath(`/chapter/events`)

  return { success: true }
}
