'use server'

import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
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

  if (!authUser) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: adminUser } = await supabase
    .from('User')
    .select('id, role')
    .eq('id', authUser.id)
    .single()

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.recruiterEmail)) {
    return { success: false, error: 'Invalid email address' }
  }

  const { data: company } = await supabase
    .from('Company')
    .select('id')
    .eq('id', formData.companyId)
    .single()

  if (!company) {
    return { success: false, error: 'Company not found' }
  }

  const { data: existingInvite, error: existingInviteError } = await supabase
    .from('RecruiterAccess')
    .select('id, acceptedAt, inviteExpiresAt')
    .eq('recruiterEmail', formData.recruiterEmail)
    .eq('companyId', formData.companyId)
    .is('revokedAt', null)
    .maybeSingle()

  if (existingInviteError) {
    return { success: false, error: 'Failed to validate existing invitations' }
  }

  if (existingInvite) {
    if (existingInvite.acceptedAt) {
      return {
        success: false,
        error: 'This recruiter already has access to this company',
      }
    }

    const isExpired =
      existingInvite.inviteExpiresAt &&
      new Date(existingInvite.inviteExpiresAt) <= new Date()

    if (!isExpired) {
      return {
        success: false,
        error: 'A pending invitation already exists for this email and company',
      }
    }
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
    return { success: false, error: 'Failed to create invitation' }
  }

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

  if (!authUser) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: adminUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: invite } = await supabase
    .from('RecruiterAccess')
    .select('id, acceptedAt, revokedAt')
    .eq('id', inviteId)
    .single()

  if (!invite) {
    return { success: false, error: 'Invitation not found' }
  }

  if (invite.revokedAt) {
    return { success: false, error: 'Already revoked' }
  }

  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      revokedAt: new Date().toISOString(),
      revokedById: authUser.id,
      isActive: false,
    })
    .eq('id', inviteId)

  if (error) {
    return { success: false, error: 'Failed to revoke invitation' }
  }

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

  if (!authUser) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: adminUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: invite } = await supabase
    .from('RecruiterAccess')
    .select('id, recruiterEmail, acceptedAt, revokedAt')
    .eq('id', inviteId)
    .single()

  if (!invite) {
    return { success: false, error: 'Invitation not found' }
  }

  if (invite.acceptedAt) {
    return { success: false, error: 'Cannot resend an accepted invitation' }
  }

  if (invite.revokedAt) {
    return { success: false, error: 'Cannot resend a revoked invitation' }
  }

  const newInviteToken = generateInviteToken()
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      inviteToken: newInviteToken,
      inviteExpiresAt: newExpiresAt.toISOString(),
    })
    .eq('id', inviteId)

  if (error) {
    return { success: false, error: 'Failed to resend invitation' }
  }

  revalidatePath('/admin/invites')

  return { success: true, message: 'Invitation resent successfully' }
}
