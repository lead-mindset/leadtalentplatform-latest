import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import { LeadIdentityService } from '@/lib/services/lead-identity.service'
import { logger } from '@/lib/logger'

type OnboardPresidentParams = {
  userId: string
  chapterId: string
  grantedById?: string | null
}

type ActionResult = { success: true } | { success: false; error: string }

export async function onboardPresident(
  supabase: SupabaseClient<Database>,
  params: OnboardPresidentParams
): Promise<ActionResult> {
  // Phase 1+2: user.role bump removed — identity issuance handled by
  // ChapterRoleAssignmentService.assignChapterRole during approval flow.
  // This file is a candidate for removal in Phase 3; only identity
  // issuance remains here temporarily.
  const identityResult = await LeadIdentityService.issueChapterEditorIdentity(supabase, {
    userId: params.userId,
    chapterId: params.chapterId,
    issuedById: params.grantedById,
    makePrimary: true,
  })
  if (!identityResult.success) {
    logger.error(
      { context: 'chapter-president/identity', userId: params.userId, chapterId: params.chapterId },
      'Failed to issue chapter editor identity'
    )
    return identityResult
  }

  return { success: true }
}
