'use server'

import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import nodemailer from 'nodemailer'

function generateInviteToken(): string {
  return randomUUID()
}

async function auditLog(action: string, details: any) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}`, details)
}

export async function createRecruiterInvite(formData: {
  recruiterEmail: string
  companyId: string
  expiresInDays?: number
}) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { success: false, error: 'Not authenticated' }

  const { data: adminUser } = await supabase
    .from('User')
    .select('id, role')
    .eq('id', authUser.id)
    .single()
  if (!adminUser || adminUser.role !== 'admin')
    return { success: false, error: 'Unauthorized' }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.recruiterEmail))
    return { success: false, error: 'Invalid email address' }

  const { data: company } = await supabase
    .from('Company')
    .select('id, name')
    .eq('id', formData.companyId)
    .single()
  if (!company) return { success: false, error: 'Company not found' }

  const { data: existingInvite } = await supabase
    .from('RecruiterAccess')
    .select('id, acceptedAt, inviteExpiresAt')
    .eq('recruiterEmail', formData.recruiterEmail)
    .eq('companyId', formData.companyId)
    .is('revokedAt', null)
    .maybeSingle()
  if (existingInvite) {
    if (existingInvite.acceptedAt)
      return { success: false, error: 'Recruiter already has access' }
    const isExpired =
      existingInvite.inviteExpiresAt &&
      new Date(existingInvite.inviteExpiresAt) <= new Date()
    if (!isExpired)
      return { success: false, error: 'Pending invite already exists' }
  }

  const expiresAt = formData.expiresInDays
    ? new Date(Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const inviteToken = generateInviteToken()

  const { data: invite, error: inviteError } = await supabase
    .from('RecruiterAccess')
    .insert({
      recruiterEmail: formData.recruiterEmail,
      inviteToken,
      companyId: formData.companyId,
      grantedById: authUser.id,
      grantedAt: new Date().toISOString(),
      inviteExpiresAt: expiresAt.toISOString(),
      isActive: false,
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
      revokedById: null,
    })
    .select('id')
    .single()
  if (inviteError || !invite) {
    console.error('Invite creation error:', inviteError)
    return {
      success: false,
      error: inviteError?.message || 'Failed to create invitation',
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.verify()

    const inviteLink = `${process.env.FRONTEND_URL}/company/onboard?token=${inviteToken}`

    await transporter.sendMail({
      from: `"LEAD Platform" <${process.env.SMTP_USER}>`,
      to: formData.recruiterEmail,
      subject: `You're invited to LEAD - ${company.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to LEAD</h2>
          <p>Hello,</p>
          <p>You've been invited to join the LEAD talent platform as a recruiter for <strong>${company.name}</strong>.</p>
          
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${inviteLink}" style="color: #0070f3;">${inviteLink}</a>
          </p>
          
          <p style="color: #666; font-size: 14px;">
            This invitation expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
    await supabase.from('RecruiterAccess').delete().eq('id', invite.id)
    return { success: false, error: 'Failed to send invitation email' }
  }

  await auditLog('CREATE_INVITE', {
    adminId: authUser.id,
    recruiterEmail: formData.recruiterEmail,
    companyId: formData.companyId,
    inviteId: invite.id,
  })

  revalidatePath('/admin/invites')
  revalidatePath('/admin/companies')

  return {
    success: true,
    inviteId: invite.id,
    message: `Invitation sent to ${formData.recruiterEmail}`,
  }
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
    .select('id, acceptedAt, revokedAt, recruiterEmail, companyId')
    .eq('id', inviteId)
    .single()
  if (!invite) return { success: false, error: 'Invitation not found' }
  if (invite.revokedAt) return { success: false, error: 'Already revoked' }

  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      revokedAt: new Date().toISOString(),
      revokedById: authUser.id,
      isActive: false,
    })
    .eq('id', inviteId)
  if (error) return { success: false, error: 'Failed to revoke invitation' }

  await auditLog('REVOKE_INVITE', {
    adminId: authUser.id,
    inviteId,
    recruiterEmail: invite.recruiterEmail,
    companyId: invite.companyId,
  })

  revalidatePath('/admin/invites')

  return {
    success: true,
    message: invite.acceptedAt
      ? 'Recruiter access revoked successfully'
      : 'Invitation revoked successfully',
  }
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
    .select(
      'id, recruiterEmail, acceptedAt, revokedAt, companyId, inviteToken, inviteExpiresAt, Company (name)'
    )
    .eq('id', inviteId)
    .single()
  if (!invite) return { success: false, error: 'Invitation not found' }
  if (invite.acceptedAt) return { success: false, error: 'Cannot resend an accepted invitation' }
  if (invite.revokedAt) return { success: false, error: 'Cannot resend a revoked invitation' }

  const newInviteToken = generateInviteToken()
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('RecruiterAccess')
    .update({ inviteToken: newInviteToken, inviteExpiresAt: newExpiresAt.toISOString() })
    .eq('id', inviteId)
  if (error) return { success: false, error: 'Failed to resend invitation' }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    await transporter.verify()
    
    const inviteLink = `${process.env.FRONTEND_URL}/company/onboard?token=${newInviteToken}`

    const companyName = Array.isArray(invite.Company) 
      ? invite.Company[0]?.name 
      : invite.Company?.name

    await transporter.sendMail({
      from: `"LEAD Platform" <${process.env.SMTP_USER}>`,
      to: invite.recruiterEmail,
      subject: `Reminder: Your LEAD invitation - ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">LEAD Invitation Reminder</h2>
          <p>Hello,</p>
          <p>This is a reminder that you've been invited to join the LEAD talent platform for <strong>${companyName}</strong>.</p>
          
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${inviteLink}" style="color: #0070f3;">${inviteLink}</a>
          </p>
          
          <p style="color: #666; font-size: 14px;">
            This invitation expires on ${newExpiresAt.toLocaleDateString()} at ${newExpiresAt.toLocaleTimeString()}.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send email:', err)
    return { success: false, error: 'Failed to resend invitation email' }
  }

  await auditLog('RESEND_INVITE', {
    adminId: authUser.id,
    inviteId,
    recruiterEmail: invite.recruiterEmail,
  })

  revalidatePath('/admin/invites')
  return { success: true, message: 'Invitation resent successfully' }
}