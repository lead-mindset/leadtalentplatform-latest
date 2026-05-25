import { NextRequest, NextResponse } from 'next/server'
import { assertCanManageEvent } from '@/lib/actions/events/access'
import { sendApplicationRejectedEmail } from '@/lib/emails/send-email'

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
    await request.json()
  } catch {
    // Ignore optional JSON payload; the current implementation does not persist notes.
  }

  const { data: application } = await supabase
    .from('event_registration')
    .select(`
      id,
      User!eventregistration_userid_fkey (email, name),
      Event!EventRegistration_eventId_fkey (title, Chapter!inner(name))
    `)
    .eq('id', applicationId)
    .single()

  const { error } = await supabase
    .from('event_registration')
    .update({
      status: 'rejected',
    })
    .eq('id', applicationId)
    .eq('event_id', eventId)

  if (error) {
    console.error('Rejection error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (application && application.User && application.Event) {
    const user = application.User as unknown as { email: string; name: string | null }
    const event = application.Event as unknown as { title: string; Chapter?: { name: string } | null }
    void sendApplicationRejectedEmail(
      user.email,
      user.name ?? 'Student',
      event.title,
      event.Chapter?.name || 'LEAD Chapter',
      'es'
    ).catch(err => console.error('Email error:', err))
  }

  return NextResponse.json({ success: true })
}
