'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server-service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { RecruiterService } from '@/lib/services/recruiter.service'

const inviteAcceptanceSchema = z.object({
  token: z.string().trim().min(1),
  userId: z.string().trim().min(1),
})

type AcceptInviteResult =
  | { success: true }
  | { success: false; error: string }

type TokenValidationResult =
  | {
      valid: true
      access: {
        id: string
        recruiter_email: string
        accepted_at: string | null
        accepted_by_user_id: string | null
        invite_expires_at: string | null
        revoked_at: string | null
        company_id: string
      }
    }
  | { valid: false; error: string; code: 'invalid' | 'expired' | 'revoked' }

export async function validateInviteToken(token: string): Promise<TokenValidationResult> {
  const supabase = createServiceClient()
  return RecruiterService.validateInviteToken(supabase, token)
}

export async function acceptInvite(token: string, userId: string): Promise<AcceptInviteResult> {
  const parsed = inviteAcceptanceSchema.safeParse({ token, userId })
  if (!parsed.success) {
    return { success: false, error: 'A valid invite token is required.' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== parsed.data.userId) {
    return { success: false, error: 'Authentication required.' }
  }

  const authEmail = auth.user.email?.toLowerCase() ?? ''
  const authName = auth.user.user_metadata?.full_name ?? auth.user.user_metadata?.name ?? ''

  const serviceSupabase = createServiceClient()
  const result = await RecruiterService.acceptInvite(
    serviceSupabase,
    parsed.data.userId,
    parsed.data.token,
    authEmail,
    authName
  )

  if (result.success) {
    revalidatePath('/company/onboard')
    revalidatePath('/company')
    revalidatePath('/company/dashboard')
    revalidatePath('/recruiter/access')
  }

  return result
}
