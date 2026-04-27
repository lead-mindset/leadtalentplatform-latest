'use server'

import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import { AdminService } from '@/lib/services/admin.service'


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

function generateInviteLink(token: string): string {
  return `${FRONTEND_URL}/company/onboard?inviteToken=${token}`
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

async function sendInviteEmail(email: string, inviteToken: string, companyName?: string) {
  const url = generateInviteLink(inviteToken)

  await transporter.sendMail({
    from: `"${companyName || 'Company'} Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `You're invited to join ${companyName || 'the team'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: hsl(var(--primary));">Welcome to ${companyName || 'the Team'}!</h2>
        <p>You've been invited to join the recruiter portal. Click the button below to get started:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); text-decoration: none; border-radius: 6px; font-weight: 500;">
            Accept Invitation
          </a>
        </div>
        <p style="color: hsl(var(--muted-foreground)); font-size: 14px;">
          <strong>What happens next:</strong>
        </p>
        <ol style="color: hsl(var(--muted-foreground)); font-size: 14px; line-height: 1.6;">
          <li>Click the button above to accept your invitation</li>
          <li>Complete your profile</li>
          <li>You'll receive a login link via email (no password needed!)</li>
          <li>Start accessing candidate profiles</li>
        </ol>
        <div style="background-color: hsl(var(--primary)/10); border-left: 4px solid hsl(var(--primary)); padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: hsl(var(--primary)); font-size: 14px;">
            <strong>Passwordless Access:</strong> We use secure email links for login. No passwords to remember!
          </p>
        </div>
        <p style="color: hsl(var(--muted-foreground)); font-size: 12px; margin-top: 30px;">
          This invitation link will expire in 7 days.
        </p>
        <hr style="border: none; border-top: 1px solid hsl(var(--border)); margin: 30px 0;">
        <p style="color: hsl(var(--muted-foreground)); font-size: 12px;">
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

async function auditLog(action: string, details: Record<string, string | number | null | undefined>) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}`, details)
}

type ActionResult =
  | { success: true; inviteId?: string; message: string }
  | { success: false; error: string }

export async function createRecruiterInvite(formData: {
  recruiterEmail: string
  companyId: string
  expiresInDays?: number
}): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin()

  // Validate company exists
  const company = await AdminService.validateCompanyExists(supabase, formData.companyId)
  if (!company) return { success: false, error: 'Company not found' }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.recruiterEmail))
    return { success: false, error: 'Invalid email' }

  // Check existing invite
  const existingInvite = await AdminService.checkExistingRecruiterInvite(
    supabase,
    formData.recruiterEmail,
    formData.companyId
  )

  if (existingInvite) {
    if (existingInvite.accepted_at)
      return { success: false, error: 'Recruiter already has access' }
    if (!existingInvite.revoked_at)
      return { success: false, error: 'Pending invite already exists' }
  }

  const result = await AdminService.createRecruiterInvite(supabase, user.id, {
    recruiterEmail: formData.recruiterEmail,
    companyId: formData.companyId,
    expiresInDays: formData.expiresInDays,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // Send onboarding email
  try {
    await sendInviteEmail(formData.recruiterEmail, result.token, company.name)
  } catch (error) {
    // Clean up if email fails
    await AdminService.deleteInvite(supabase, result.inviteId)
    return { success: false, error: `Failed to send email: ${getErrorMessage(error)}` }
  }

  await auditLog('CREATE_INVITE', {
    adminId: user.id,
    recruiterEmail: formData.recruiterEmail,
    companyId: formData.companyId,
    inviteId: result.inviteId,
    expiresInDays: formData.expiresInDays ?? 7,
  })

  revalidatePath('/admin/invites')

  return { success: true, inviteId: result.inviteId, message: 'Invite sent successfully' }
}

export async function resendInvite(inviteId: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin()

  const invite = await AdminService.getInviteForResend(supabase, inviteId)
  if (!invite) return { success: false, error: 'Invite not found' }
  if (invite.revoked_at) return { success: false, error: 'Invite revoked' }
  if (invite.accepted_at) return { success: false, error: 'Invite already accepted' }

  const regenerateResult = await AdminService.regenerateInviteToken(supabase, inviteId)
  if (!regenerateResult.success) {
    return { success: false, error: regenerateResult.error }
  }

  // Resend email
  try {
    await sendInviteEmail(invite.recruiter_email, regenerateResult.token, invite.company?.name)
  } catch (error) {
    return { success: false, error: `Failed to send email: ${getErrorMessage(error)}` }
  }

  await auditLog('RESEND_INVITE', {
    adminId: user.id,
    inviteId,
    recruiterEmail: invite.recruiter_email,
    companyId: invite.company_id,
  })

  revalidatePath('/admin/invites')

  return { success: true, message: 'Invite resent successfully' }
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin()

  const invite = await AdminService.getInviteForRevoke(supabase, inviteId)
  if (!invite) return { success: false, error: 'Invite not found' }
  if (invite.revoked_at) return { success: false, error: 'Invite already revoked' }

  const result = await AdminService.revokeInvite(supabase, user.id, inviteId)
  if (!result.success) {
    return result
  }

  await auditLog('REVOKE_INVITE', {
    adminId: user.id,
    inviteId,
    recruiterEmail: invite.recruiter_email,
    companyId: invite.company_id,
  })

  revalidatePath('/admin/invites')

  return { success: true, message: 'Invite revoked successfully' }
}
