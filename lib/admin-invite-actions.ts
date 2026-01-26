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
        <p>Hello,</p>
        <p>You've been invited to LEAD at <strong>${company.name}</strong>.</p>
        <p><a href="${inviteLink}" target="_blank">Accept Invitation</a></p>
        <p>This link expires on ${expiresAt.toISOString()}.</p>
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
      'id, recruiterEmail, acceptedAt, revokedAt, companyId, inviteToken, inviteExpiresAt'
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

    await transporter.sendMail({
      from: `"LEAD Platform" <${process.env.SMTP_USER}>`,
      to: invite.recruiterEmail,
      subject: 'Your LEAD invitation has been resent',
      html: `
        <p>Hello,</p>
        <p>Your invitation to LEAD has been resent.</p>
        <p><a href="${inviteLink}" target="_blank">Accept Invitation</a></p>
        <p>This link expires on ${newExpiresAt.toISOString()}.</p>
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
