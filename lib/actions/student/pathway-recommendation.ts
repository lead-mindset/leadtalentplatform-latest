'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  PathwayCheckInService,
  type PathwayRecommendationStatus,
} from '@/lib/services/pathway-check-in.service'

const ALLOWED_STATUSES = new Set<PathwayRecommendationStatus>([
  'started',
  'completed',
  'dismissed',
])

export async function updatePathwayRecommendationStatus(formData: FormData): Promise<void> {
  const recommendationId = formData.get('recommendation_id')?.toString() ?? ''
  const status = formData.get('status')?.toString() as PathwayRecommendationStatus

  if (!recommendationId || !ALLOWED_STATUSES.has(status)) {
    return
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) return

    const result = await PathwayCheckInService.updateRecommendationStatus(supabase, {
      userId: user.id,
      recommendationId,
      status: status as Exclude<PathwayRecommendationStatus, 'active'>,
    })

    if (!result.success) return
  } catch (error) {
    console.error('Pathway recommendation update error:', error)
    return
  }

  revalidatePath('/student')
}
