import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invitation token' },
        { status: 400 }
      )
    }

    const { data: invite, error } = await supabase
      .from('RecruiterAccess')
      .select(`
        *,
        company:Company(name)
      `)
      .eq('inviteToken', token)
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(invite.inviteExpiresAt)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      )
    }

    if (invite.acceptedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      companyName: invite.company.name,
      recruiterEmail: invite.recruiterEmail,
      expiresAt: invite.inviteExpiresAt,
    })

  } catch (error) {
    console.error('Failed to verify invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}