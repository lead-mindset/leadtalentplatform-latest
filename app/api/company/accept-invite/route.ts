import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to accept an invitation' },
        { status: 401 }
      )
    }

    // 2. Get token
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invitation token' },
        { status: 400 }
      )
    }

    // 3. Find invitation (with company name)
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

    // 4. Validate invitation state
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

    // 5. Optional: Verify email matches
    if (user.email !== invite.recruiterEmail) {
      return NextResponse.json(
        { error: 'You must sign in with the invited email address' },
        { status: 403 }
      )
    }

    // 6. Accept invitation
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

    // 7. Success
    return NextResponse.json({
      success: true,
      companyName: invite.company.name,
      redirectTo: '/company/dashboard',
    })

  } catch (error) {
    console.error('Unexpected error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}