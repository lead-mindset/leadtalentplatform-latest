import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mailer } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const InviteSchema = z.object({
  recruiterEmail: z.string().email("Invalid email format"),
})

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const companyId = params.id

  try {
    await requireAdmin(supabase)

    const { data: recruiters, error } = await supabase
      .from('RecruiterAccess')
      .select(`
        id,
        recruiterEmail,
        isActive,
        grantedAt,
        inviteExpiresAt,
        acceptedAt,
        revokedAt,
        inviteToken,
        grantedBy:User!RecruiterAccess_grantedById_fkey(name, email),
        acceptedByUser:User!RecruiterAccess_acceptedByUserId_fkey(name, email),
        revokedBy:User!RecruiterAccess_revokedById_fkey(name, email)
      `)
      .eq('companyId', companyId)
      .order('grantedAt', { ascending: false })

    if (error) {
      console.error('Failed to fetch recruiters:', error)
      throw error
    }

    return NextResponse.json({ recruiters })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to fetch recruiters:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const companyId = params.id

  try {
    const admin = await requireAdmin(supabase)

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('Company')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { recruiterEmail } = InviteSchema.parse(body)

    const { data: existingInvites } = await supabase
      .from('RecruiterAccess')
      .select('id, acceptedAt, isActive, revokedAt')
      .eq('recruiterEmail', recruiterEmail)
      .eq('companyId', companyId)

    const hasActiveAccess = existingInvites?.some(
      inv => inv.isActive && inv.acceptedAt && !inv.revokedAt
    )
    if (hasActiveAccess) {
      return NextResponse.json(
        { error: 'Recruiter already has active access to this company' },
        { status: 409 }
      )
    }

    const hasPendingInvite = existingInvites?.some(
      inv => !inv.acceptedAt && !inv.revokedAt
    )
    if (hasPendingInvite) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 409 }
      )
    }

    const inviteToken = crypto.randomUUID()
    const inviteExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

    const { error: insertError } = await supabase
      .from('RecruiterAccess')
      .insert({
        companyId: company.id,
        recruiterEmail,
        grantedById: admin.id,
        inviteToken,
        inviteExpiresAt: inviteExpiresAt.toISOString(),
        isActive: false,
      })

    if (insertError) {
      console.error('Failed to create invite:', insertError)
      throw insertError
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/company/join/${inviteToken}`

    try {
      await mailer.sendMail({
        from: `"LEAD Platform" <${process.env.SMTP_USER}>`,
        to: recruiterEmail,
        subject: `You're invited to LEAD - ${company.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to LEAD</h2>
            <p>Hello,</p>
            <p>You've been granted access to the LEAD talent platform for <strong>${company.name}</strong>.</p>
            <p style="margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link expires in 7 days.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      
      // Rollback: delete the invite
      await supabase
        .from('RecruiterAccess')
        .delete()
        .eq('inviteToken', inviteToken)

      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      companyName: company.name,
      expiresAt: inviteExpiresAt.toISOString()
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to create invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
