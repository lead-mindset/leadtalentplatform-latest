'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// ===== HELPERS =====
function generateInviteToken(): string {
  return randomUUID()
}

async function sendInviteEmail(email: string, inviteToken: string, companyName?: string) {
const url = `${FRONTEND_URL}/company/onboard?inviteToken=${inviteToken}`

  await transporter.sendMail({
    from: `"${companyName || 'Company'} Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `You're invited to join ${companyName || 'the team'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to ${companyName || 'the Team'}!</h2>
        
        <p>You've been invited to join the recruiter portal. Click the button below to get started:</p>
        
        <div style="text-align: center; margin: 30px 0;">
<a href="${url}">Accept Invitation</a>
  Log in
</a>

        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>What happens next:</strong>
        </p>
        <ol style="color: #666; font-size: 14px; line-height: 1.6;">
          <li>Click the button above to accept your invitation</li>
          <li>Complete your profile</li>
          <li>You'll receive a login link via email (no password needed!)</li>
          <li>Start accessing candidate profiles</li>
        </ol>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            🔒 <strong>Passwordless Access:</strong> We use secure email links for login. No passwords to remember!
          </p>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This invitation link will expire in 7 days.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `
You've been invited to join ${companyName || 'the team'} as a recruiter!

Click here to accept your invitation: ${url}

What happens next:
1. Click the link above to accept your invitation
2. Complete your profile
3. You'll receive a login link via email (no password needed!)
4. Start accessing candidate profiles

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `.trim(),
  })
}


async function auditLog(action: string, details: any) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}`, details)
}

// ===== CREATE RECRUITER INVITE =====
export async function createRecruiterInvite(formData: {
  recruiterEmail: string
  companyId: string
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { success: false, error: 'Not authenticated' }

  // Admin check
  const { data: adminUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', authUser.id)
    .single()
  if (!adminUser || adminUser.role !== 'admin')
    return { success: false, error: 'Unauthorized' }

  // Validate company exists
  const { data: company } = await supabase
    .from('Company')
    .select('id')
    .eq('id', formData.companyId)
    .single()
  if (!company) return { success: false, error: 'Company not found' }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.recruiterEmail))
    return { success: false, error: 'Invalid email' }

  // Check existing invite
  const { data: existingInvite } = await supabase
    .from('RecruiterAccess')
    .select('id, acceptedAt, revokedAt')
    .eq('recruiterEmail', formData.recruiterEmail)
    .eq('companyId', formData.companyId)
    .maybeSingle()

  if (existingInvite) {
    if (existingInvite.acceptedAt)
      return { success: false, error: 'Recruiter already has access' }
    if (!existingInvite.revokedAt)
      return { success: false, error: 'Pending invite already exists' }
  }

  const inviteToken = generateInviteToken()

  // Insert invite into DB
  const { data: invite, error: inviteError } = await supabase
    .from('RecruiterAccess')
    .insert({
      recruiterEmail: formData.recruiterEmail,
      companyId: formData.companyId,
      grantedById: authUser.id,
      grantedAt: new Date().toISOString(),
      inviteToken,
      isActive: false,
    })
    .select('id')
    .single()

  if (inviteError || !invite)
    return { success: false, error: inviteError?.message }

  // Send onboarding email
  try {
    await sendInviteEmail(formData.recruiterEmail, inviteToken)
  } catch (e: any) {
    // Clean up if email fails
    await supabase.from('RecruiterAccess').delete().eq('id', invite.id)
    return { success: false, error: `Failed to send email: ${e.message}` }
  }

  await auditLog('CREATE_INVITE', {
    adminId: authUser.id,
    recruiterEmail: formData.recruiterEmail,
    companyId: formData.companyId,
    inviteId: invite.id,
  })

  revalidatePath('/admin/invites')

  return { success: true, inviteId: invite.id, message: 'Invite sent successfully' }
}

export async function resendInvite(inviteId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { success: false, error: 'Not authenticated' }

  const { data: adminUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', authUser.id)
    .single()
  if (!adminUser || adminUser.role !== 'admin')
    return { success: false, error: 'Unauthorized' }

  const { data: invite } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .eq('id', inviteId)
    .single()
  if (!invite) return { success: false, error: 'Invite not found' }
  if (invite.revokedAt) return { success: false, error: 'Invite revoked' }
  if (invite.acceptedAt) return { success: false, error: 'Invite already accepted' }

  // Optionally regenerate token
  const newToken = generateInviteToken()
  const { error: updateError } = await supabase
    .from('RecruiterAccess')
    .update({ inviteToken: newToken })
    .eq('id', inviteId)
  if (updateError) return { success: false, error: 'Failed to update invite token' }

  // Resend email
  try {
    await sendInviteEmail(invite.recruiterEmail, newToken)
  } catch (e: any) {
    return { success: false, error: `Failed to send email: ${e.message}` }
  }

  await auditLog('RESEND_INVITE', {
    adminId: authUser.id,
    inviteId,
    recruiterEmail: invite.recruiterEmail,
    companyId: invite.companyId,
  })

  revalidatePath('/admin/invites')

  return { success: true, message: 'Invite resent successfully' }
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { success: false, error: 'Not authenticated' }

  const { data: adminUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', authUser.id)
    .single()
  if (!adminUser || adminUser.role !== 'admin')
    return { success: false, error: 'Unauthorized' }

  const { data: invite } = await supabase
    .from('RecruiterAccess')
    .select('*')
    .eq('id', inviteId)
    .single()
  if (!invite) return { success: false, error: 'Invite not found' }
  if (invite.revokedAt) return { success: false, error: 'Invite already revoked' }

  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      revokedAt: new Date().toISOString(),
      revokedById: authUser.id,
      isActive: false,
    })
    .eq('id', inviteId)

  if (error) return { success: false, error: 'Failed to revoke invite' }

  await auditLog('REVOKE_INVITE', {
    adminId: authUser.id,
    inviteId,
    recruiterEmail: invite.recruiterEmail,
    companyId: invite.companyId,
  })

  revalidatePath('/admin/invites')

  return { success: true, message: 'Invite revoked successfully' }
}
