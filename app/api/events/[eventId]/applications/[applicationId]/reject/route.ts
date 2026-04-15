 import { NextRequest, NextResponse } from 'next/server'
import { assertCanManageEvent } from '@/lib/actions/events/access'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; applicationId: string }> }
) {
  const { eventId, applicationId } = await params
  const access = await assertCanManageEvent(eventId)
  if ('error' in access) {
    const status = access.error === 'Event not found' ? 404 : 403
    return NextResponse.json({ error: access.error }, { status })
  }
  const { supabase } = access

  try {
    const body = await request.json()
  } catch {
    // Ignore optional JSON payload; the current implementation does not persist notes.
  }

  const { data: application } = await supabase
    .from('EventRegistration')
    .select(`
      id,
      User!eventregistration_userid_fkey (email, name),
      Event!EventRegistration_eventId_fkey (title, Chapter!inner(name))
    `)
    .eq('id', applicationId)
    .single()

  const { error } = await supabase
    .from('EventRegistration')
    .update({
      status: 'rejected',
      qrToken: undefined,
    })
    .eq('id', applicationId)
    .eq('eventId', eventId)

  if (error) {
    console.error('Rejection error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (application && application.User && application.Event) {
    import('@/lib/emails/send-email').then(({ sendApplicationRejectedEmail }) => {
      sendApplicationRejectedEmail(
        application.User.email,
        application.User.name,
        application.Event.title,
        application.Event.Chapter?.name || 'LEAD Chapter'
      ).catch(err => console.error('Email error:', err))
    })
  }

  return NextResponse.json({ success: true })
}
