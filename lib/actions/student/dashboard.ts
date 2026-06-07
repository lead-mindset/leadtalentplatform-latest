'use server'

import { createClient } from '@/lib/supabase/server'
import {
  StudentDashboardService,
  type StudentActivationDashboard,
} from '@/lib/services/student-dashboard.service'
import { PathwayCheckInService } from '@/lib/services/pathway-check-in.service'
import { PathwayRolloutService } from '@/lib/services/pathway-rollout.service'
import { GrowthReflectionService } from '@/lib/services/growth-reflection.service'

export async function getStudentDashboardSecondaryData(params: {
  userId: string
  chapterId: string | null
  status: StudentActivationDashboard['status']
}) {
  const supabase = await createClient()
  const pathwayFlags = await PathwayRolloutService.getFlagsForChapter(supabase, params.chapterId)

  const [pathwayGuidance, reflectionProgress, chapterOptionsResult] = await Promise.all([
    pathwayFlags.enable_recommendation_card
      ? PathwayCheckInService.getDashboardGuidanceForUser(supabase, params.userId)
      : Promise.resolve(null),
    GrowthReflectionService.getProgressForUser(supabase, params.userId),
    params.status === 'participant'
      ? StudentDashboardService.getChapterApplicationOptionsResult(supabase)
      : Promise.resolve({ success: true as const, data: [] }),
  ])

  return {
    pathwayFlags,
    pathwayGuidance,
    reflectionProgress,
    chapterOptions: chapterOptionsResult.data,
    chapterOptionsLoadState: chapterOptionsResult.success ? 'ready' as const : 'unavailable' as const,
    chapterOptionsError: chapterOptionsResult.success ? undefined : chapterOptionsResult.error,
  }
}
