import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import type {
  LeadEvidenceSignalKey,
  LeadRecommendationCtaType,
  LeadRecommendationSourceType,
  PathwayGrowthStageKey,
  PathwayPrimaryFocusKey,
} from '@/lib/lead-taxonomy'
import { logger } from '@/lib/logger'

export type PathwayRecommendationCategory = 'learn' | 'connect' | 'prove'
export type PathwayRecommendationStatus = 'active' | 'started' | 'completed' | 'dismissed'

export type PathwayCheckInAnswersForMatching = {
  looking_for: string
  current_blocker: string
  study_interest: string
  confidence_level: number
  monthly_time_commitment: string
}

export type PathwayClassificationForMatching = {
  growth_stage: PathwayGrowthStageKey
  primary_focus: PathwayPrimaryFocusKey
}

export type PathwayIntelligenceRecommendation = {
  category: PathwayRecommendationCategory
  title: string
  body: string
  reason: string
  sort_order: number
  source_type: LeadRecommendationSourceType
  source_event_id: string | null
  cta_type: LeadRecommendationCtaType | null
  evidence_signal: LeadEvidenceSignalKey | null
  matched_reasons: string[]
}

type EventPathwayMetadataMatchRow = Pick<
  Database['public']['Tables']['event_pathway_metadata']['Row'],
  | 'event_id'
  | 'primary_okr'
  | 'pillar_keys'
  | 'student_goal'
  | 'growth_stage_fit'
  | 'student_outcomes'
  | 'proof_outcome'
  | 'evidence_signals'
  | 'audience'
  | 'cta_type'
  | 'recommendation_safety'
>

type EventMatchRow = Pick<
  Database['public']['Tables']['event']['Row'],
  'id' | 'title' | 'description' | 'chapter_id' | 'start_at' | 'access_model' | 'is_published'
>

type ScoredEventMatch = {
  metadata: EventPathwayMetadataMatchRow
  event: EventMatchRow
  score: number
  reasons: string[]
}

const FOCUS_LABELS: Record<PathwayPrimaryFocusKey, string> = {
  career_exploration: 'career paths',
  technical_experience: 'technical experience',
  opportunity_readiness: 'opportunity readiness',
  community_mentorship: 'community and belonging',
  leadership: 'leadership',
}

const FOCUS_OKR_HINTS: Record<PathwayPrimaryFocusKey, string[]> = {
  career_exploration: ['inspire', 'elevate'],
  technical_experience: ['empower'],
  opportunity_readiness: ['elevate'],
  community_mentorship: ['unite'],
  leadership: ['empower', 'inspire'],
}

function learnTitle(focus: PathwayPrimaryFocusKey) {
  if (focus === 'technical_experience') return 'Choose one hands-on technical session'
  if (focus === 'opportunity_readiness') return 'Join one career-readiness workshop'
  if (focus === 'leadership') return 'Attend one leadership learning moment'
  if (focus === 'community_mentorship') return 'Learn how your LEAD chapter works'
  return 'Explore one STEM or career pathway'
}

function proveTitle(focus: PathwayPrimaryFocusKey) {
  if (focus === 'technical_experience') return 'Capture proof from one technical experience'
  if (focus === 'opportunity_readiness') return 'Turn one experience into a profile update'
  if (focus === 'leadership') return 'Document one leadership action you can take'
  if (focus === 'community_mentorship') return 'Reflect on where you fit in LEAD'
  return 'Capture one insight about a path you want to explore'
}

function timeText(monthlyTimeCommitment: string) {
  if (monthlyTimeCommitment === 'one_hour') return 'small enough for a one-hour month'
  if (monthlyTimeCommitment === 'two_to_four_hours') {
    return 'realistic for two to four hours this month'
  }
  return 'strong enough for a deeper five-hour push this month'
}

export function generateFallbackPathwayRecommendations(params: {
  answers: PathwayCheckInAnswersForMatching
  classification: PathwayClassificationForMatching
}): PathwayIntelligenceRecommendation[] {
  const focusLabel = FOCUS_LABELS[params.classification.primary_focus]

  return [
    {
      category: 'learn',
      title: learnTitle(params.classification.primary_focus),
      body: `Pick one event, workshop, program, or resource that helps you understand ${focusLabel} through action.`,
      reason: `Suggested because your check-in points to ${focusLabel} and a step that is ${timeText(params.answers.monthly_time_commitment)}.`,
      sort_order: 1,
      source_type: 'fixed_action',
      source_event_id: null,
      cta_type: 'attend',
      evidence_signal: 'event_attendance',
      matched_reasons: [`Your check-in points to ${focusLabel}.`],
    },
    {
      category: 'connect',
      title: 'Strengthen your LEAD profile',
      body: 'Update one profile detail so future LEAD opportunities can understand your interests and readiness.',
      reason: 'Suggested because a clearer profile helps LEAD connect you to better-fit opportunities without asking you to repeat yourself.',
      sort_order: 2,
      source_type: 'profile_action',
      source_event_id: null,
      cta_type: 'update_profile',
      evidence_signal: 'profile_updated',
      matched_reasons: ['A stronger profile improves future recommendation quality.'],
    },
    {
      category: 'prove',
      title: proveTitle(params.classification.primary_focus),
      body: 'Create a tiny artifact: a reflection, project note, resume bullet draft, or short summary of what you learned.',
      reason: 'Suggested so your participation starts becoming proof of growth, not just activity.',
      sort_order: 3,
      source_type: 'proof_action',
      source_event_id: null,
      cta_type: 'reflect',
      evidence_signal: 'reflection_completed',
      matched_reasons: ['Proof helps you remember and reuse what you learned.'],
    },
  ]
}

function scoreMatch(params: {
  metadata: EventPathwayMetadataMatchRow
  event: EventMatchRow
  chapterId: string | null
  classification: PathwayClassificationForMatching
}): ScoredEventMatch {
  let score = 0
  const reasons: string[] = []
  const focus = params.classification.primary_focus
  const stage = params.classification.growth_stage

  if (params.metadata.student_goal === focus) {
    score += 5
    reasons.push(`Matches your ${FOCUS_LABELS[focus]} goal.`)
  }

  if (params.metadata.growth_stage_fit.includes(stage)) {
    score += 3
    reasons.push('Fits your current Pathway stage.')
  }

  if (params.chapterId && params.event.chapter_id === params.chapterId) {
    score += 2
    reasons.push('Available through your chapter context.')
  }

  if (params.metadata.primary_okr && FOCUS_OKR_HINTS[focus].includes(params.metadata.primary_okr)) {
    score += 2
    reasons.push(`Supports LEAD's ${params.metadata.primary_okr} OKR.`)
  }

  if (params.metadata.student_outcomes.length > 0) {
    score += 1
    reasons.push('Has a clear student outcome.')
  }

  if (params.metadata.evidence_signals.length > 0) {
    score += 1
    reasons.push('Can create measurable proof of participation.')
  }

  return {
    metadata: params.metadata,
    event: params.event,
    score,
    reasons,
  }
}

function buildEventRecommendation(match: ScoredEventMatch): PathwayIntelligenceRecommendation {
  const isApplication = match.event.access_model === 'application' || match.metadata.cta_type === 'apply'
  const ctaType: LeadRecommendationCtaType = isApplication ? 'apply' : 'register'
  const evidenceSignal = match.metadata.evidence_signals[0] ?? 'event_registration'

  return {
    category: 'learn',
    title: isApplication ? `Apply for ${match.event.title}` : `Register for ${match.event.title}`,
    body: isApplication
      ? 'This event matches your check-in. Apply for consideration; submitting an application does not guarantee a spot.'
      : 'This event matches your check-in and is available as a concrete next move.',
    reason: match.reasons.join(' '),
    sort_order: 1,
    source_type: 'event',
    source_event_id: match.event.id,
    cta_type: ctaType,
    evidence_signal: evidenceSignal as LeadEvidenceSignalKey,
    matched_reasons: match.reasons,
  }
}

async function loadBestEventMatch(
  supabase: SupabaseClient<Database>,
  params: {
    chapterId: string | null
    classification: PathwayClassificationForMatching
    now: Date
  }
): Promise<ScoredEventMatch | null> {
  const { data: metadataData, error: metadataError } = await supabase
    .from('event_pathway_metadata')
    .select(
      [
        'event_id',
        'primary_okr',
        'pillar_keys',
        'student_goal',
        'growth_stage_fit',
        'student_outcomes',
        'proof_outcome',
        'evidence_signals',
        'audience',
        'cta_type',
        'recommendation_safety',
      ].join(', ')
    )
    .eq('is_pathway_eligible', true)
    .eq('metadata_status', 'ready')
    .in('recommendation_safety', ['recommendable_now', 'recommend_only_if_event_active'])

  if (metadataError) {
    logger.error(
      { context: 'PathwayIntelligenceService.loadBestEventMatch.metadata', error: metadataError },
      'Failed to load event Pathway metadata'
    )
    return null
  }

  const metadataRows = (metadataData ?? []) as unknown as EventPathwayMetadataMatchRow[]
  if (metadataRows.length === 0) return null

  const eventIds = metadataRows.map((row) => row.event_id)
  const { data: eventData, error: eventError } = await supabase
    .from('event')
    .select('id, title, description, chapter_id, start_at, access_model, is_published')
    .in('id', eventIds)
    .eq('is_published', true)
    .gte('start_at', params.now.toISOString())
    .order('start_at', { ascending: true })

  if (eventError) {
    logger.error(
      { context: 'PathwayIntelligenceService.loadBestEventMatch.events', error: eventError },
      'Failed to load eligible Pathway events'
    )
    return null
  }

  const eventsById = new Map(
    ((eventData ?? []) as unknown as EventMatchRow[]).map((event) => [event.id, event])
  )

  const scored = metadataRows
    .map((metadata) => {
      const event = eventsById.get(metadata.event_id)
      if (!event) return null
      return scoreMatch({
        metadata,
        event,
        chapterId: params.chapterId,
        classification: params.classification,
      })
    })
    .filter((match): match is ScoredEventMatch => Boolean(match))
    .filter((match) => match.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime()
    })

  return scored[0] ?? null
}

export const PathwayIntelligenceService = {
  async generateRecommendations(
    supabase: SupabaseClient<Database>,
    params: {
      chapterId: string | null
      answers: PathwayCheckInAnswersForMatching
      classification: PathwayClassificationForMatching
      now?: Date
    }
  ): Promise<PathwayIntelligenceRecommendation[]> {
    const fallbackRecommendations = generateFallbackPathwayRecommendations({
      answers: params.answers,
      classification: params.classification,
    })

    const eventMatch = await loadBestEventMatch(supabase, {
      chapterId: params.chapterId,
      classification: params.classification,
      now: params.now ?? new Date(),
    })

    if (!eventMatch) return fallbackRecommendations

    return [
      buildEventRecommendation(eventMatch),
      ...fallbackRecommendations.filter((recommendation) => recommendation.category !== 'learn'),
    ]
  },
}
