'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { LeadIdentityService } from '@/lib/services/lead-identity.service'

const identityTypeSchema = z.enum([
  'founder',
  'staff',
  'chapter_editor',
  'chapter_member',
  'alumni',
])

const issueIdentitySchema = z.object({
  userId: z.string().uuid(),
  identityType: identityTypeSchema,
  chapterId: z.string().trim().min(1).nullable().optional(),
  makePrimary: z.boolean().optional(),
})

const identityTargetSchema = z.object({
  userId: z.string().uuid(),
  identityId: z.string().uuid(),
})

export async function issueLeadIdentity(input: z.infer<typeof issueIdentitySchema>) {
  const parsed = issueIdentitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid LEAD identity request.' }
  }

  const { supabase, user } = await requireAdmin()
  const result = await LeadIdentityService.issueIdentity(supabase, {
    userId: parsed.data.userId,
    identityType: parsed.data.identityType,
    chapterId: parsed.data.chapterId ?? null,
    issuedById: user.id,
    makePrimary: parsed.data.makePrimary,
  })

  if (result.success) {
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${parsed.data.userId}`)
  }

  return result
}

export async function setPrimaryLeadIdentity(input: z.infer<typeof identityTargetSchema>) {
  const parsed = identityTargetSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid LEAD identity target.' }
  }

  const { supabase } = await requireAdmin()
  const result = await LeadIdentityService.setPrimaryIdentity(supabase, parsed.data)

  if (result.success) {
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${parsed.data.userId}`)
  }

  return result
}

export async function revokeLeadIdentity(input: z.infer<typeof identityTargetSchema>) {
  const parsed = identityTargetSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid LEAD identity target.' }
  }

  const { supabase } = await requireAdmin()
  const result = await LeadIdentityService.revokeIdentity(supabase, parsed.data)

  if (result.success) {
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${parsed.data.userId}`)
  }

  return result
}

export async function getLeadIdentities(userId: string) {
  const parsed = z.string().uuid().safeParse(userId)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid user ID.' }
  }

  const { supabase } = await requireAdmin()
  return LeadIdentityService.getActiveIdentities(supabase, parsed.data)
}
