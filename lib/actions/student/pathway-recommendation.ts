'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

function isSafeRecommendationTarget(path: string) {
  return path === '/events' ||
    path.startsWith('/events/') ||
    path === '/student' ||
    path.startsWith('/student/')
}

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

export async function startPathwayRecommendation(formData: FormData): Promise<void> {
  const recommendationId = formData.get('recommendation_id')?.toString() ?? ''
  const targetPath = formData.get('target_path')?.toString() ?? '/student'

  if (!recommendationId || !isSafeRecommendationTarget(targetPath)) {
    return
  }

  let shouldRedirect = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) return

    const result = await PathwayCheckInService.updateRecommendationStatus(supabase, {
      userId: user.id,
      recommendationId,
      status: 'started',
    })

    if (!result.success) return
    shouldRedirect = true
  } catch (error) {
    console.error('Pathway recommendation start error:', error)
    return
  }

  revalidatePath('/student')
  if (shouldRedirect) redirect(targetPath)
}
