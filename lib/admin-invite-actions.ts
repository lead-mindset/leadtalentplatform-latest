'use server'

import { createClient } from './supabase/server'
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

async function sendInviteEmail(email: string, inviteToken: string) {
  const url = `${FRONTEND_URL}/company/onboard?inviteToken=${inviteToken}`
  await transporter.sendMail({
    from: `"Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your recruiter invite',
    text: `You have been invited to join the company dashboard. Click here to accept: ${url}`,
    html: `<p>You have been invited to join the company dashboard.</p>
           <p><a href="${url}">Click here to accept your invitation</a></p>`,
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
