import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error("Unauthorized")
  }

  const { data: dbUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'admin') {
    throw new Error("Forbidden")
  }

  return user
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient()
  const token = params.token

  try {
    // 1. Verify admin
    const admin = await requireAdmin(supabase)

    // 2. Find the invite
    const { data: invite, error: findError } = await supabase
      .from('RecruiterAccess')
      .select('id, acceptedAt, isActive, recruiterEmail')
      .eq('inviteToken', token)
      .single()

    if (findError || !invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // 3. Check if already revoked
    if (invite.revokedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been revoked' },
        { status: 409 }
      )
    }

    // 4. Revoke the invite
    const { error: revokeError } = await supabase
      .from('RecruiterAccess')
      .update({
        isActive: false,
        revokedAt: new Date().toISOString(),
        revokedById: admin.id,
      })
      .eq('inviteToken', token)

    if (revokeError) {
      console.error('Failed to revoke invitation:', revokeError)
      return NextResponse.json(
        { error: 'Failed to revoke invitation' },
        { status: 500 }
      )
    }

    // 5. Success
    return NextResponse.json({
      success: true,
      message: `Access revoked for ${invite.recruiterEmail}`,
      wasAccepted: !!invite.acceptedAt,
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Unexpected error revoking invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}