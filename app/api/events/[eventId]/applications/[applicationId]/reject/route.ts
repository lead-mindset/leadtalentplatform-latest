import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; applicationId: string }> }
) {
  const { eventId, applicationId } = await params
  const supabase = await createClient()
  const body = await request.json()
  const { internalNote } = body
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: application } = await supabase
    .from('EventRegistration')
    .select(`
      id,
      User:userId (email, name),
      Event:eventId (title, Chapter (name))
    `)
    .eq('id', applicationId)
    .single()

  const { error } = await supabase
    .from('EventRegistration')
    .update({
      status: 'rejected',
      qrToken: null,
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
        application.User[0].email,
        application.User[0].name,
        application.Event[0].title,
        application.Event[0].Chapter?.[0]?.name || 'LEAD Chapter'
      ).catch(err => console.error('Email error:', err))
    })
  }

  return NextResponse.json({ success: true })
}
