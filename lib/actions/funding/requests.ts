'use server'

import { revalidatePath } from 'next/cache'
import { requireChapterMember } from '@/lib/auth'
import { FundingService } from '@/lib/services/funding.service'
import {
  CloseFundingRequestSchema,
  FundingAccountabilitySchema,
  FundingRequestInputSchema,
  SaveFundingRequestSchema,
  SubmitFundingRequestSchema,
} from '@/lib/actions/funding/schemas'

type FundingActionResult =
  | { success: true; requestId: string }
  | { success: false; error: string }

function revalidateFundingPaths(requestId?: string) {
  revalidatePath('/chapter/funding')
  revalidatePath('/admin/funding')
  if (requestId) {
    revalidatePath(`/chapter/funding/${requestId}`)
    revalidatePath(`/admin/funding/${requestId}`)
  }
}

export async function createFundingDraft(input: unknown): Promise<FundingActionResult> {
  const parsed = FundingRequestInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Solicitud invalida.' }
  }

  const { supabase, user, chapter_id } = await requireChapterMember()
  const result = await FundingService.createDraft(supabase, {
    ...parsed.data,
    chapterId: chapter_id,
    requesterUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

export async function saveFundingDraft(input: unknown): Promise<FundingActionResult> {
  const parsed = SaveFundingRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Solicitud invalida.' }
  }

  const { supabase, user, chapter_id } = await requireChapterMember()
  const result = await FundingService.saveDraft(supabase, {
    ...parsed.data,
    chapterId: chapter_id,
    requesterUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

export async function submitFundingRequest(input: unknown): Promise<FundingActionResult> {
  const parsed = SubmitFundingRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Solicitud invalida.' }
  }

  const { supabase, user } = await requireChapterMember()
  const result = await FundingService.submitRequest(supabase, {
    actorUserId: user.id,
    requestId: parsed.data.requestId,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

export async function updateFundingAccountability(input: unknown): Promise<FundingActionResult> {
  const parsed = FundingAccountabilitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Solicitud invalida.' }
  }

  const { supabase, user } = await requireChapterMember()
  const result = await FundingService.updateAccountability(supabase, {
    ...parsed.data,
    actorUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

export async function closeChapterFundingRequest(input: unknown): Promise<FundingActionResult> {
  const parsed = CloseFundingRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Solicitud invalida.' }
  }

  const { supabase, user } = await requireChapterMember()
  const result = await FundingService.closeRequest(supabase, {
    ...parsed.data,
    actorUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(result.data.id)
  return { success: true, requestId: result.data.id }
}

