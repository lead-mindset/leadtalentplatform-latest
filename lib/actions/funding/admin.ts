'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { FundingService } from '@/lib/services/funding.service'
import {
  CloseFundingRequestSchema,
  FundingSourceSchema,
  ReviewFundingRequestSchema,
} from '@/lib/actions/funding/schemas'

type FundingAdminActionResult =
  | { success: true; requestId: string }
  | { success: false; error: string }

function revalidateFundingPaths(requestId?: string) {
  revalidatePath('/admin/funding')
  revalidatePath('/chapter/funding')
  if (requestId) {
    revalidatePath(`/admin/funding/${requestId}`)
    revalidatePath(`/chapter/funding/${requestId}`)
  }
}

export async function reviewFundingRequest(input: unknown): Promise<FundingAdminActionResult> {
  const parsed = ReviewFundingRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Decision invalida.' }
  }

  const { supabase, user } = await requireAdmin()
  const result = await FundingService.reviewRequest(supabase, {
    ...parsed.data,
    actorUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

export async function setFundingSource(input: unknown): Promise<FundingAdminActionResult> {
  const parsed = FundingSourceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Fuente invalida.' }
  }

  const { supabase, user } = await requireAdmin()
  const result = await FundingService.setFundingSource(supabase, {
    ...parsed.data,
    actorUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

export async function closeAdminFundingRequest(input: unknown): Promise<FundingAdminActionResult> {
  const parsed = CloseFundingRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Cierre invalido.' }
  }

  const { supabase, user } = await requireAdmin()
  const result = await FundingService.closeRequest(supabase, {
    ...parsed.data,
    actorUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

