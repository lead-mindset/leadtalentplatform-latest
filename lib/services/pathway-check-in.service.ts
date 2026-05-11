import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import type { PathwayCheckInRow } from '@/lib/types'
import { logger } from '@/lib/logger'

export type PathwayCheckInStatus = 'not_started' | 'in_progress' | 'completed'
export type PathwayGrowthStage =
  | 'explorer'
  | 'builder'
  | 'leader'
  | 'candidate'
  | 'emerging_professional'
export type PathwayPrimaryFocus =
  | 'career_exploration'
  | 'technical_experience'
  | 'opportunity_readiness'
  | 'community_mentorship'
  | 'leadership'

export type PathwayCheckInAnswers = {
  looking_for: string
  current_blocker: string
  study_interest: string
  confidence_level: number
  monthly_time_commitment: string
}

export type PathwayCheckInState = {
  status: PathwayCheckInStatus
  row: PathwayCheckInRow | null
}

export type PathwayClassification = {
  growth_stage: PathwayGrowthStage
  primary_focus: PathwayPrimaryFocus
}

const CHECK_IN_SELECT = `
  id,
  user_id,
  chapter_id,
  status,
  looking_for,
  current_blocker,
  study_interest,
  confidence_level,
  monthly_time_commitment,
  growth_stage,
  primary_focus,
  submitted_at,
  created_at,
  updated_at
`

function normalizeStatus(status: string | null | undefined): PathwayCheckInStatus {
  if (status === 'in_progress' || status === 'completed') return status
  return 'not_started'
}

export function classifyPathwayCheckIn(
  answers: PathwayCheckInAnswers
): PathwayClassification {
  const primaryFocusByGoal: Record<string, PathwayPrimaryFocus> = {
    explore_career_paths: 'career_exploration',
    build_technical_experience: 'technical_experience',
    prepare_for_opportunities: 'opportunity_readiness',
    find_community_mentorship: 'community_mentorship',
    start_leading: 'leadership',
  }

  let growthStage: PathwayGrowthStage = 'explorer'

  if (answers.looking_for === 'start_leading') {
    growthStage = 'leader'
  } else if (
    answers.looking_for === 'prepare_for_opportunities' ||
    answers.current_blocker === 'need_career_prep'
  ) {
    growthStage = 'candidate'
  } else if (
    answers.looking_for === 'build_technical_experience' ||
    answers.current_blocker === 'need_more_experience'
  ) {
    growthStage = 'builder'
  } else if (
    answers.confidence_level >= 4 &&
    answers.monthly_time_commitment === 'five_plus_hours'
  ) {
    growthStage = 'emerging_professional'
  }

  return {
    growth_stage: growthStage,
    primary_focus: primaryFocusByGoal[answers.looking_for] ?? 'career_exploration',
  }
}

export const PathwayCheckInService = {
  async getForUser(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<PathwayCheckInState> {
    const { data, error } = await supabase
      .from('pathway_check_in')
      .select(CHECK_IN_SELECT)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      logger.error(
        { context: 'PathwayCheckInService.getForUser', userId, error },
        'Failed to load pathway check-in'
      )
      return { status: 'not_started', row: null }
    }

    const row = (data ?? null) as PathwayCheckInRow | null
    return {
      status: normalizeStatus(row?.status),
      row,
    }
  },

  async saveCompletedCheckIn(
    supabase: SupabaseClient<Database>,
    params: {
      userId: string
      chapterId: string | null
      answers: PathwayCheckInAnswers
    }
  ): Promise<{ success: true } | { success: false; error: string }> {
    const now = new Date().toISOString()
    const classification = classifyPathwayCheckIn(params.answers)

    const { error } = await supabase
      .from('pathway_check_in')
      .upsert(
        {
          user_id: params.userId,
          chapter_id: params.chapterId,
          status: 'completed',
          looking_for: params.answers.looking_for,
          current_blocker: params.answers.current_blocker,
          study_interest: params.answers.study_interest,
          confidence_level: params.answers.confidence_level,
          monthly_time_commitment: params.answers.monthly_time_commitment,
          growth_stage: classification.growth_stage,
          primary_focus: classification.primary_focus,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      logger.error(
        { context: 'PathwayCheckInService.saveCompletedCheckIn', userId: params.userId, error },
        'Failed to save pathway check-in'
      )
      return { success: false, error: 'Unable to save pathway check-in' }
    }

    return { success: true }
  },
}
