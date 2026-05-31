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

  const [pathwayGuidance, reflectionProgress, chapterOptions] = await Promise.all([
    pathwayFlags.enable_recommendation_card
      ? PathwayCheckInService.getDashboardGuidanceForUser(supabase, params.userId)
      : Promise.resolve(null),
    GrowthReflectionService.getProgressForUser(supabase, params.userId),
    params.status === 'participant'
      ? StudentDashboardService.getChapterApplicationOptions(supabase)
      : Promise.resolve([]),
  ])

  return {
    pathwayFlags,
    pathwayGuidance,
    reflectionProgress,
    chapterOptions,
  }
}
