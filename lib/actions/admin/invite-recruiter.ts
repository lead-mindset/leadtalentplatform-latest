'use server'

import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { AdminService } from '@/lib/services/admin.service'
import { sendCompanyRepresentativeInviteEmail } from '@/lib/emails/send-email'
import { logger } from '@/lib/logger'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

async function auditLog(action: string, details: Record<string, string | number | boolean | null | undefined>) {
  logger.info(
    {
      context: 'admin/recruiter-invite',
      action,
      ...details,
    },
    'Recruiter invite action'
  )
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
      return { success: false, error: 'Company representative already has access' }
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
    const emailResult = await sendCompanyRepresentativeInviteEmail(
      formData.recruiterEmail,
      result.token,
      company.name
    )

    if (!emailResult.success) {
      throw new Error(emailResult.error)
    }
  } catch (error) {
    // Clean up if email fails
    await AdminService.deleteInvite(supabase, result.inviteId)
    return { success: false, error: `Failed to send email: ${getErrorMessage(error)}` }
  }

  await auditLog('CREATE_INVITE', {
    adminAuthenticated: Boolean(user.id),
    recruiterEmailPresent: Boolean(formData.recruiterEmail),
    companyIdPresent: Boolean(formData.companyId),
    inviteIdPresent: Boolean(result.inviteId),
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
    const emailResult = await sendCompanyRepresentativeInviteEmail(
      invite.recruiter_email,
      regenerateResult.token,
      invite.company?.name
    )

    if (!emailResult.success) {
      throw new Error(emailResult.error)
    }
  } catch (error) {
    return { success: false, error: `Failed to send email: ${getErrorMessage(error)}` }
  }

  await auditLog('RESEND_INVITE', {
    adminAuthenticated: Boolean(user.id),
    inviteIdPresent: Boolean(inviteId),
    recruiterEmailPresent: Boolean(invite.recruiter_email),
    companyIdPresent: Boolean(invite.company_id),
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
    adminAuthenticated: Boolean(user.id),
    inviteIdPresent: Boolean(inviteId),
    recruiterEmailPresent: Boolean(invite.recruiter_email),
    companyIdPresent: Boolean(invite.company_id),
  })

  revalidatePath('/admin/invites')

  return { success: true, message: 'Invite revoked successfully' }
}
