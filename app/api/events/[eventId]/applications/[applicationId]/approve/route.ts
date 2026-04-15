import { NextRequest, NextResponse } from 'next/server'
import { assertCanManageEvent } from '@/lib/actions/events/access'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string; applicationId: string }> }
) {
  const { eventId, applicationId } = await params
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) {
    const status = access.error === 'Event not found' ? 404 : 403
    return NextResponse.json({ error: access.error }, { status })
  }
  const { supabase, user } = access

  const { data, error } = await supabase.rpc('bulk_approve_applications', {
    p_event_id: eventId,
    p_application_ids: [applicationId],
    p_approved_by: user.id,
  })

  if (error) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data as { capacity_warning: boolean; capacity_status: string } | null

  const { data: registration } = await supabase
    .from('EventRegistration')
    .select(`
      id,
      User!eventregistration_userid_fkey (email, name),
      Event!EventRegistration_eventId_fkey (title, startAt, location, meetingUrl, eventType)
    `)
    .eq('id', applicationId)
    .single()

  if (registration && registration.User && registration.Event) {
    import('@/lib/emails/send-email').then(({ sendApplicationApprovedEmail }) => {
      sendApplicationApprovedEmail(
        registration.User.email,
        registration.User.name,
        registration.Event.title,
        new Date(registration.Event.startAt).toLocaleString(),
        registration.Event.location,
        registration.Event.meetingUrl,
        registration.Event.eventType,
        registration.id
      ).catch(err => console.error('Email error:', err))
    })
  }

  return NextResponse.json({
    success: true,
    capacityWarning: result?.capacity_warning,
    capacityStatus: result?.capacity_status,
  })
}
