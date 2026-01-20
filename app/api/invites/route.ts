import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mailer } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const InviteSchema = z.object({
  recruiterEmail: z.string().email("Invalid email format"),
  companyName: z.string().min(1, "Company name required").max(100),
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

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    // 1. Auth check
    const admin = await requireAdmin(supabase)

    // 2. Validate input
    const body = await req.json()
    const { recruiterEmail, companyName } = InviteSchema.parse(body)

    // 3. Find or create company
    let { data: company, error: companyFindError } = await supabase
      .from('Company')
      .select('id, name')
      .eq('name', companyName)
      .single()

    if (companyFindError && companyFindError.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      console.error('Company lookup error:', companyFindError)
      throw new Error('Database error')
    }

    if (!company) {
      // Company doesn't exist, create it
      const { data: newCompany, error: createError } = await supabase
        .from('Company')
        .insert({ 
          name: companyName, 
          createdbyid: admin.id 
        })
        .select('id, name')
        .single()
      
      if (createError) {
        console.error('Failed to create company:', createError)
        throw new Error('Failed to create company')
      }

      company = newCompany
    }

    // 4. Check for existing active invite
    const { data: existingInvites } = await supabase
      .from('RecruiterAccess')
      .select('id, acceptedAt, isActive')
      .eq('recruiterEmail', recruiterEmail)
      .eq('companyId', company.id)

    // Check if already has active access
    const hasActiveAccess = existingInvites?.some(inv => inv.isActive && inv.acceptedAt)
    if (hasActiveAccess) {
      return NextResponse.json(
        { error: 'Recruiter already has active access to this company' },
        { status: 409 }
      )
    }

    // Check for pending invites
    const hasPendingInvite = existingInvites?.some(inv => !inv.acceptedAt)
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
      throw new Error('Database error')
    }

    const inviteLink = `${process.env.FRONTEND_URL}/company/onboard?token=${inviteToken}`

    try {
      await mailer.sendMail({
        from: `"LEAD Platform" <${process.env.SMTP_USER}>`,
        to: recruiterEmail,
        subject: `You're invited to LEAD - ${companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to LEAD</h2>
            <p>Hello,</p>
            <p>You've been granted access to the LEAD talent platform for <strong>${companyName}</strong>.</p>
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
    })

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
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    await requireAdmin(supabase)

    const { data: recruiters, error } = await supabase
      .from('RecruiterAccess')
      .select(`
        *,
        company:Company(id, name)
      `)
      .order('grantedAt', { ascending: false })

    if (error) throw error

    return NextResponse.json({ recruiters })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    console.error('Failed to fetch recruiters:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}