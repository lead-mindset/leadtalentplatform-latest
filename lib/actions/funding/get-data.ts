'use server'

import { notFound } from 'next/navigation'
import { requireAdmin, requireChapterMember, requireUser } from '@/lib/auth'
import { FundingService, type FundingRequestStatus } from '@/lib/services/funding.service'

export async function getChapterFundingData() {
  const { supabase, user, chapter_id } = await requireChapterMember()
  return FundingService.listChapterRequests(supabase, {
    actorUserId: user.id,
    chapterId: chapter_id,
  })
}

export async function getAdminFundingData(status?: FundingRequestStatus | 'all' | null) {
  const { supabase, user } = await requireAdmin()
  return FundingService.listAdminRequests(supabase, {
    actorUserId: user.id,
    status,
  })
}

export async function getFundingRequestDetail(requestId: string) {
  const { supabase, user } = await requireUser()
  const result = await FundingService.getRequestDetail(supabase, {
    actorUserId: user.id,
    requestId,
  })

  if (!result.success && result.error === 'Funding request not found.') {
    notFound()
  }

  return result
}

