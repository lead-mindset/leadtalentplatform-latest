import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient()
  const token = params.token

  try {
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

// POST: Accept invite (called when user clicks "Accept" button)
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient()
  const token = params.token

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to accept an invitation' },
        { status: 401 }
      )
    }

    const { data: invite, error: findError } = await supabase
      .from('RecruiterAccess')
      .select(`
        *,
        company:Company(name)
      `)
      .eq('inviteToken', token)
      .single()

    if (findError || !invite) {
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

    if (user.email !== invite.recruiterEmail) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabase
      .from('RecruiterAccess')
      .update({
        acceptedAt: new Date().toISOString(),
        isActive: true,
        acceptedByUserId: user.id,
      })
      .eq('inviteToken', token)

    if (updateError) {
      console.error('Failed to accept invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      )
    }

    const { error: roleError } = await supabase
      .from('User')
      .update({ role: 'recruiter' })
      .eq('id', user.id)

    if (roleError) {
      console.error('Failed to update user role:', roleError)
    }

    return NextResponse.json({
      success: true,
      companyName: invite.company.name,
      redirectTo: '/company',
    })
  } catch (error) {
    console.error('Unexpected error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
