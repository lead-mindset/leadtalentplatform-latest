import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import type { PathwayCheckInRow, PathwayRecommendationRow } from '@/lib/types'
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
export type PathwayRecommendationStatus = 'active' | 'started' | 'completed' | 'dismissed'

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

export type PathwayDashboardGuidance = PathwayCheckInState & {
  recommendations: PathwayRecommendationRow[]
  progress: {
    actionable: number
    completed: number
  }
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

export type ChapterAggregateTrend = {
  value: string
  count: number
}

export type ChapterPathwayInsights = {
  totalMembers: number
  completedCheckIns: number
  completionRate: number
  topNeeds: ChapterAggregateTrend[]
  topBlockers: ChapterAggregateTrend[]
  growthStages: ChapterAggregateTrend[]
  primaryFocuses: ChapterAggregateTrend[]
  completedReflections: number
  proofItemsCreated: number
}

export type AdminPilotRiskSignal = {
  key: 'low_check_in_adoption' | 'low_next_move_completion' | 'low_reflection_conversion'
  label: string
  severity: 'watch' | 'risk'
  value: number
  threshold: number
}

export type AdminPathwayPilotMetrics = {
  totalApprovedMembers: number
  completedCheckIns: number
  checkInCompletionRate: number
  totalNextMoves: number
  nextMovesCompletedWithin14Days: number
  nextMoveCompletionRate14Days: number
  proofItemsCreated: number
  completedReflections: number
  growthReflectionCompletionRate: number
  riskSignals: AdminPilotRiskSignal[]
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

const RECOMMENDATION_SELECT = `
  id,
  check_in_id,
  user_id,
  category,
  status,
  title,
  body,
  reason,
  sort_order,
  created_at,
  updated_at
`

function normalizeStatus(status: string | null | undefined): PathwayCheckInStatus {
  if (status === 'in_progress' || status === 'completed') return status
  return 'not_started'
}

function getTopCounts(values: Array<string | null | undefined>, limit = 3): ChapterAggregateTrend[] {
  const counts = new Map<string, number>()

  values.forEach((value) => {
    if (!value) return
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, limit)
}

const EMPTY_CHAPTER_INSIGHTS: ChapterPathwayInsights = {
  totalMembers: 0,
  completedCheckIns: 0,
  completionRate: 0,
  topNeeds: [],
  topBlockers: [],
  growthStages: [],
  primaryFocuses: [],
  completedReflections: 0,
  proofItemsCreated: 0,
}

const EMPTY_ADMIN_PILOT_METRICS: AdminPathwayPilotMetrics = {
  totalApprovedMembers: 0,
  completedCheckIns: 0,
  checkInCompletionRate: 0,
  totalNextMoves: 0,
  nextMovesCompletedWithin14Days: 0,
  nextMoveCompletionRate14Days: 0,
  proofItemsCreated: 0,
  completedReflections: 0,
  growthReflectionCompletionRate: 0,
  riskSignals: [],
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
}

function isCompletedWithinDays(row: { status: string; created_at: string; updated_at: string }, days: number) {
  if (row.status !== 'completed') return false
  const createdAt = new Date(row.created_at).getTime()
  const updatedAt = new Date(row.updated_at).getTime()
  if (Number.isNaN(createdAt) || Number.isNaN(updatedAt)) return false
  return updatedAt - createdAt <= days * 24 * 60 * 60 * 1000
}

function buildPilotRiskSignals(metrics: Omit<AdminPathwayPilotMetrics, 'riskSignals'>): AdminPilotRiskSignal[] {
  const signals: AdminPilotRiskSignal[] = []

  if (metrics.totalApprovedMembers > 0 && metrics.checkInCompletionRate < 40) {
    signals.push({
      key: 'low_check_in_adoption',
      label: 'Check-In adoption is below pilot target',
      severity: metrics.checkInCompletionRate < 25 ? 'risk' : 'watch',
      value: metrics.checkInCompletionRate,
      threshold: 40,
    })
  }

  if (metrics.totalNextMoves > 0 && metrics.nextMoveCompletionRate14Days < 25) {
    signals.push({
      key: 'low_next_move_completion',
      label: 'Students are not completing next moves fast enough',
      severity: metrics.nextMoveCompletionRate14Days < 15 ? 'risk' : 'watch',
      value: metrics.nextMoveCompletionRate14Days,
      threshold: 25,
    })
  }

  if (metrics.completedCheckIns > 0 && metrics.growthReflectionCompletionRate < 20) {
    signals.push({
      key: 'low_reflection_conversion',
      label: 'Check-Ins are not converting into Growth Reflections',
      severity: metrics.growthReflectionCompletionRate < 10 ? 'risk' : 'watch',
      value: metrics.growthReflectionCompletionRate,
      threshold: 20,
    })
  }

  return signals
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

  async getDashboardGuidanceForUser(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<PathwayDashboardGuidance> {
    const checkIn = await this.getForUser(supabase, userId)

    if (!checkIn.row || checkIn.status !== 'completed') {
      return { ...checkIn, recommendations: [], progress: { actionable: 0, completed: 0 } }
    }

    const { data, error } = await supabase
      .from('pathway_recommendation')
      .select(RECOMMENDATION_SELECT)
      .eq('check_in_id', checkIn.row.id)
      .in('status', ['active', 'started', 'completed'])
      .order('sort_order', { ascending: true })

    if (error) {
      logger.error(
        {
          context: 'PathwayCheckInService.getDashboardGuidanceForUser',
          userId,
          error,
        },
        'Failed to load pathway dashboard recommendations'
      )
      return { ...checkIn, recommendations: [], progress: { actionable: 0, completed: 0 } }
    }

    const recommendations = (data ?? []) as PathwayRecommendationRow[]
    return {
      ...checkIn,
      recommendations,
      progress: {
        actionable: recommendations.length,
        completed: recommendations.filter((recommendation) => recommendation.status === 'completed')
          .length,
      },
    }
  },

  async updateRecommendationStatus(
    supabase: SupabaseClient<Database>,
    params: {
      userId: string
      recommendationId: string
      status: Exclude<PathwayRecommendationStatus, 'active'>
    }
  ): Promise<{ success: true } | { success: false; error: string }> {
    const { error } = await supabase
      .from('pathway_recommendation')
      .update({
        status: params.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.recommendationId)
      .eq('user_id', params.userId)

    if (error) {
      logger.error(
        {
          context: 'PathwayCheckInService.updateRecommendationStatus',
          userId: params.userId,
          recommendationId: params.recommendationId,
          error,
        },
        'Failed to update pathway recommendation status'
      )
      return { success: false, error: 'Unable to update recommendation' }
    }

    return { success: true }
  },

  async getChapterAggregateInsights(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<ChapterPathwayInsights> {
    const [{ data: memberRows, error: memberError }, { data: checkInRows, error: checkInError }] =
      await Promise.all([
        supabase
          .from('chapter_membership')
          .select('user_id')
          .eq('chapter_id', chapterId)
          .eq('status', 'approved'),
        supabase
          .from('pathway_check_in')
          .select(
            'id, user_id, status, looking_for, current_blocker, growth_stage, primary_focus'
          )
          .eq('chapter_id', chapterId)
          .eq('status', 'completed'),
      ])

    if (memberError || checkInError) {
      logger.error(
        {
          context: 'PathwayCheckInService.getChapterAggregateInsights',
          chapterId,
          memberError,
          checkInError,
        },
        'Failed to load chapter pathway insights'
      )
      return EMPTY_CHAPTER_INSIGHTS
    }

    const memberIds = ((memberRows ?? []) as Array<{ user_id: string | null }>)
      .map((row) => row.user_id)
      .filter((userId): userId is string => Boolean(userId))
    const checkIns = (checkInRows ?? []) as Array<{
      id: string
      user_id: string
      status: string
      looking_for: string | null
      current_blocker: string | null
      growth_stage: string | null
      primary_focus: string | null
    }>

    let completedReflections = 0
    let proofItemsCreated = 0

    if (memberIds.length > 0) {
      const { data: reflectionRows, error: reflectionError } = await supabase
        .from('growth_reflection')
        .select('id, status, user_id')
        .in('user_id', memberIds)

      if (reflectionError) {
        logger.error(
          {
            context: 'PathwayCheckInService.getChapterAggregateInsights.reflections',
            chapterId,
            error: reflectionError,
          },
          'Failed to load chapter growth reflection counts'
        )
      } else {
        const reflections = (reflectionRows ?? []) as Array<{ id: string; status: string }>
        proofItemsCreated = reflections.length
        completedReflections = reflections.filter((row) => row.status === 'completed').length
      }
    }

    const totalMembers = memberIds.length
    const completedCheckIns = checkIns.length

    return {
      totalMembers,
      completedCheckIns,
      completionRate: totalMembers > 0 ? Math.round((completedCheckIns / totalMembers) * 100) : 0,
      topNeeds: getTopCounts(checkIns.map((row) => row.looking_for)),
      topBlockers: getTopCounts(checkIns.map((row) => row.current_blocker)),
      growthStages: getTopCounts(checkIns.map((row) => row.growth_stage)),
      primaryFocuses: getTopCounts(checkIns.map((row) => row.primary_focus)),
      completedReflections,
      proofItemsCreated,
    }
  },

  async getAdminPilotMetrics(
    supabase: SupabaseClient<Database>
  ): Promise<AdminPathwayPilotMetrics> {
    const [
      { data: memberRows, error: memberError },
      { data: checkInRows, error: checkInError },
      { data: recommendationRows, error: recommendationError },
      { data: reflectionRows, error: reflectionError },
    ] = await Promise.all([
      supabase.from('chapter_membership').select('user_id').eq('status', 'approved'),
      supabase.from('pathway_check_in').select('id, status').eq('status', 'completed'),
      supabase.from('pathway_recommendation').select('id, status, created_at, updated_at'),
      supabase.from('growth_reflection').select('id, status'),
    ])

    if (memberError || checkInError || recommendationError || reflectionError) {
      logger.error(
        {
          context: 'PathwayCheckInService.getAdminPilotMetrics',
          memberError,
          checkInError,
          recommendationError,
          reflectionError,
        },
        'Failed to load admin pathway pilot metrics'
      )
      return EMPTY_ADMIN_PILOT_METRICS
    }

    const totalApprovedMembers = ((memberRows ?? []) as Array<{ user_id: string }>).length
    const completedCheckIns = ((checkInRows ?? []) as Array<{ id: string }>).length
    const recommendations = (recommendationRows ?? []) as Array<{
      id: string
      status: string
      created_at: string
      updated_at: string
    }>
    const reflections = (reflectionRows ?? []) as Array<{ id: string; status: string }>
    const proofItemsCreated = reflections.length
    const completedReflections = reflections.filter((row) => row.status === 'completed').length

    const metricsWithoutSignals = {
      totalApprovedMembers,
      completedCheckIns,
      checkInCompletionRate: percentage(completedCheckIns, totalApprovedMembers),
      totalNextMoves: recommendations.length,
      nextMovesCompletedWithin14Days: recommendations.filter((row) =>
        isCompletedWithinDays(row, 14)
      ).length,
      nextMoveCompletionRate14Days: percentage(
        recommendations.filter((row) => isCompletedWithinDays(row, 14)).length,
        recommendations.length
      ),
      proofItemsCreated,
      completedReflections,
      growthReflectionCompletionRate: percentage(completedReflections, completedCheckIns),
    }

    return {
      ...metricsWithoutSignals,
      riskSignals: buildPilotRiskSignals(metricsWithoutSignals),
    }
  },
}
