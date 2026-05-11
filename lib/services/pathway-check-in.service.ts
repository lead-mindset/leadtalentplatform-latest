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
export type PathwayRecommendationCategory = 'learn' | 'connect' | 'prove'

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

export type GeneratedPathwayRecommendation = {
  category: PathwayRecommendationCategory
  title: string
  body: string
  reason: string
  sort_order: number
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

const FOCUS_LABELS: Record<PathwayPrimaryFocus, string> = {
  career_exploration: 'career paths',
  technical_experience: 'technical experience',
  opportunity_readiness: 'opportunity readiness',
  community_mentorship: 'community and mentorship',
  leadership: 'leadership',
}

function learnTitle(focus: PathwayPrimaryFocus) {
  if (focus === 'technical_experience') return 'Choose one hands-on technical session'
  if (focus === 'opportunity_readiness') return 'Join one career-readiness workshop'
  if (focus === 'leadership') return 'Attend one leadership learning moment'
  if (focus === 'community_mentorship') return 'Learn how your LEAD chapter works'
  return 'Explore one STEM or career pathway'
}

function proveTitle(focus: PathwayPrimaryFocus) {
  if (focus === 'technical_experience') return 'Create one small project proof'
  if (focus === 'opportunity_readiness') return 'Draft one opportunity-ready profile update'
  if (focus === 'leadership') return 'Document one leadership action you can take'
  if (focus === 'community_mentorship') return 'Write one reflection about who can support you'
  return 'Capture one insight about a path you want to explore'
}

export function generatePathwayRecommendations(params: {
  answers: PathwayCheckInAnswers
  classification: PathwayClassification
}): GeneratedPathwayRecommendation[] {
  const focusLabel = FOCUS_LABELS[params.classification.primary_focus]
  const timeText =
    params.answers.monthly_time_commitment === 'one_hour'
      ? 'small enough for a one-hour month'
      : params.answers.monthly_time_commitment === 'two_to_four_hours'
        ? 'realistic for two to four hours this month'
        : 'strong enough for a deeper five-hour push this month'

  return [
    {
      category: 'learn',
      title: learnTitle(params.classification.primary_focus),
      body: `Pick one event, workshop, program, or resource that helps you understand ${focusLabel} through action.`,
      reason: `Suggested because your check-in points to ${focusLabel} and a step that is ${timeText}.`,
      sort_order: 1,
    },
    {
      category: 'connect',
      title: 'Ask for one chapter touchpoint',
      body: 'Reach out to a chapter leader, mentor, or peer and ask what one next step they would recommend for your goal.',
      reason: 'Suggested because LEAD works best when students are not trying to figure everything out alone.',
      sort_order: 2,
    },
    {
      category: 'prove',
      title: proveTitle(params.classification.primary_focus),
      body: 'Create a tiny artifact: a reflection, project note, resume bullet draft, or short summary of what you learned.',
      reason: `Suggested so your participation starts becoming proof of growth, not just activity.`,
      sort_order: 3,
    },
  ]
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

    const { data, error } = await supabase
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
      .select('id')
      .single()

    if (error) {
      logger.error(
        { context: 'PathwayCheckInService.saveCompletedCheckIn', userId: params.userId, error },
        'Failed to save pathway check-in'
      )
      return { success: false, error: 'Unable to save pathway check-in' }
    }

    const checkInId = (data as Pick<PathwayCheckInRow, 'id'> | null)?.id
    if (!checkInId) return { success: false, error: 'Unable to save pathway check-in' }

    const recommendations = generatePathwayRecommendations({
      answers: params.answers,
      classification,
    })

    const { error: deleteError } = await supabase
      .from('pathway_recommendation')
      .delete()
      .eq('check_in_id', checkInId)

    if (deleteError) {
      logger.error(
        {
          context: 'PathwayCheckInService.saveCompletedCheckIn.recommendationDelete',
          userId: params.userId,
          error: deleteError,
        },
        'Failed to clear pathway recommendations'
      )
      return { success: false, error: 'Unable to save pathway recommendations' }
    }

    const { error: insertError } = await supabase.from('pathway_recommendation').insert(
      recommendations.map((recommendation) => ({
        check_in_id: checkInId,
        user_id: params.userId,
        status: 'active',
        category: recommendation.category,
        title: recommendation.title,
        body: recommendation.body,
        reason: recommendation.reason,
        sort_order: recommendation.sort_order,
      }))
    )

    if (insertError) {
      logger.error(
        {
          context: 'PathwayCheckInService.saveCompletedCheckIn.recommendationInsert',
          userId: params.userId,
          error: insertError,
        },
        'Failed to create pathway recommendations'
      )
      return { success: false, error: 'Unable to save pathway recommendations' }
    }

    return { success: true }
  },
}
