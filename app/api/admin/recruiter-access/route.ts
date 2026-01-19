import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mailer } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { recruiterEmail, companyName } = await req.json()
  if (!recruiterEmail || !companyName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const inviteToken = crypto.randomUUID()
  const inviteExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

  const { error } = await supabase.from('RecruiterAccess').insert({
    recruiterEmail,
    companyName,
    grantedById: user.id,
    inviteToken,
    inviteExpiresAt,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const inviteLink = `${process.env.FRONTEND_URL}/recruiter/onboard?token=${inviteToken}`

  await mailer.sendMail({
    from: `"LEAD Platform" <${process.env.SMTP_USER}>`,
    to: recruiterEmail,
    subject: `You're invited to LEAD`,
    html: `
      <p>Hello,</p>
      <p>You’ve been invited to access the LEAD talent platform for <strong>${companyName}</strong>.</p>
      <p>
        <a href="${inviteLink}">
          Accept invitation
        </a>
      </p>
      <p>This link expires in 7 days.</p>
    `,
  })

  return NextResponse.json({ success: true })
}


export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: recruiters, error } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .order('grantedAt', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recruiters })
}
