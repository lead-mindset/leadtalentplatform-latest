import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  EVENT_PATHWAY_METADATA_STATUSES,
  LEAD_COORDINATION_RISK_KEYS,
  LEAD_EVENT_AUDIENCE_KEYS,
  LEAD_EVIDENCE_SIGNAL_KEYS,
  LEAD_OKR_KEYS,
  LEAD_PILLAR_KEYS,
  LEAD_PROOF_OUTCOME_KEYS,
  LEAD_RECOMMENDATION_CTA_TYPES,
  LEAD_RECOMMENDATION_SAFETY_KEYS,
  LEAD_STUDENT_OUTCOME_KEYS,
  PATHWAY_GROWTH_STAGE_KEYS,
  PATHWAY_PRIMARY_FOCUS_KEYS,
  type EventPathwayMetadataStatus,
  type LeadCoordinationRiskKey,
  type LeadEventAudienceKey,
  type LeadEvidenceSignalKey,
  type LeadOkrKey,
  type LeadPillarKey,
  type LeadProofOutcomeKey,
  type LeadRecommendationCtaType,
  type LeadRecommendationSafetyKey,
  type LeadStudentOutcomeKey,
  type PathwayGrowthStageKey,
  type PathwayPrimaryFocusKey,
} from '@/lib/lead-taxonomy'
import { logger } from '@/lib/logger'

export type EventPathwayMetadataRow =
  Database['public']['Tables']['event_pathway_metadata']['Row']

export type EventPathwayMetadataInput = {
  eventId: string
  actorUserId: string
  isPathwayEligible: boolean
  primaryOkr?: LeadOkrKey | null
  okrAlignment?: LeadOkrKey[]
  pillarKeys?: LeadPillarKey[]
  studentGoal?: PathwayPrimaryFocusKey | null
  growthStageFit?: PathwayGrowthStageKey[]
  studentOutcomes?: LeadStudentOutcomeKey[]
  proofOutcome?: LeadProofOutcomeKey | null
  evidenceSignals?: LeadEvidenceSignalKey[]
  audience?: LeadEventAudienceKey | null
  ctaType?: LeadRecommendationCtaType | null
  coordinationRisk?: LeadCoordinationRiskKey
  recommendationSafety?: LeadRecommendationSafetyKey
  metadataStatus?: EventPathwayMetadataStatus
  notes?: string | null
}

export type EventPathwayMetadataValidation = {
  valid: boolean
  errors: string[]
}

function isOneOf<T extends readonly string[]>(value: string | null | undefined, options: T) {
  if (!value) return false
  return (options as readonly string[]).includes(value)
}

function invalidValues(values: string[] | undefined, options: readonly string[]) {
  return (values ?? []).filter((value) => !options.includes(value))
}

function requiredArray<T>(values: T[] | undefined): values is T[] {
  return Array.isArray(values) && values.length > 0
}

function uniqueEvidenceSignals(signals: LeadEvidenceSignalKey[]) {
  return [...new Set(signals)]
}

function deriveEvidenceSignals(input: Pick<EventPathwayMetadataInput, 'ctaType' | 'proofOutcome'>) {
  const signals: LeadEvidenceSignalKey[] = []

  if (input.ctaType === 'apply') signals.push('application_submitted')
  if (input.ctaType === 'attend') signals.push('event_attendance')
  if (input.ctaType === 'register') signals.push('event_registration')
  if (input.ctaType === 'update_profile') signals.push('profile_updated')
  if (input.ctaType === 'update_linkedin') signals.push('linkedin_updated')
  if (input.ctaType === 'update_resume') signals.push('resume_updated')
  if (input.ctaType === 'reflect') signals.push('reflection_completed')
  if (input.ctaType === 'capture_proof') signals.push('proof_submitted')

  switch (input.proofOutcome) {
    case 'reflection':
      signals.push('reflection_completed')
      break
    case 'certificate':
      signals.push('certificate_earned')
      break
    case 'linkedin_update':
      signals.push('linkedin_updated')
      break
    case 'resume_bullet':
      signals.push('resume_updated')
      break
    case 'pitch_deck':
    case 'project_note':
    case 'portfolio_item':
      signals.push('proof_submitted')
      break
  }

  return uniqueEvidenceSignals(signals)
}

export function validateEventPathwayMetadataInput(
  input: EventPathwayMetadataInput
): EventPathwayMetadataValidation {
  const errors: string[] = []
  const evidenceSignals = requiredArray(input.evidenceSignals)
    ? input.evidenceSignals
    : deriveEvidenceSignals(input)

  if (!input.eventId) errors.push('Event id is required.')
  if (!input.actorUserId) errors.push('Actor user id is required.')

  if (input.primaryOkr && !isOneOf(input.primaryOkr, LEAD_OKR_KEYS)) {
    errors.push('Primary OKR is not a valid LEAD OKR.')
  }

  const invalidOkrAlignment = invalidValues(input.okrAlignment, LEAD_OKR_KEYS)
  if (invalidOkrAlignment.length > 0) errors.push('OKR alignment contains invalid values.')

  const invalidPillars = invalidValues(input.pillarKeys, LEAD_PILLAR_KEYS)
  if (invalidPillars.length > 0) errors.push('Pillar keys contain invalid values.')

  if (input.studentGoal && !isOneOf(input.studentGoal, PATHWAY_PRIMARY_FOCUS_KEYS)) {
    errors.push('Student goal is not a valid Pathway focus.')
  }

  const invalidGrowthStages = invalidValues(input.growthStageFit, PATHWAY_GROWTH_STAGE_KEYS)
  if (invalidGrowthStages.length > 0) errors.push('Growth stage fit contains invalid values.')

  const invalidOutcomes = invalidValues(input.studentOutcomes, LEAD_STUDENT_OUTCOME_KEYS)
  if (invalidOutcomes.length > 0) errors.push('Student outcomes contain invalid values.')

  if (input.proofOutcome && !isOneOf(input.proofOutcome, LEAD_PROOF_OUTCOME_KEYS)) {
    errors.push('Proof outcome is not valid.')
  }

  const invalidEvidenceSignals = invalidValues(input.evidenceSignals, LEAD_EVIDENCE_SIGNAL_KEYS)
  if (invalidEvidenceSignals.length > 0) errors.push('Evidence signals contain invalid values.')

  if (input.audience && !isOneOf(input.audience, LEAD_EVENT_AUDIENCE_KEYS)) {
    errors.push('Audience is not valid.')
  }

  if (input.ctaType && !isOneOf(input.ctaType, LEAD_RECOMMENDATION_CTA_TYPES)) {
    errors.push('CTA type is not valid.')
  }

  if (
    input.coordinationRisk &&
    !isOneOf(input.coordinationRisk, LEAD_COORDINATION_RISK_KEYS)
  ) {
    errors.push('Coordination risk is not valid.')
  }

  if (
    input.recommendationSafety &&
    !isOneOf(input.recommendationSafety, LEAD_RECOMMENDATION_SAFETY_KEYS)
  ) {
    errors.push('Recommendation safety is not valid.')
  }

  if (input.metadataStatus && !isOneOf(input.metadataStatus, EVENT_PATHWAY_METADATA_STATUSES)) {
    errors.push('Metadata status is not valid.')
  }

  if (input.isPathwayEligible) {
    if (!input.primaryOkr) errors.push('Primary OKR is required when Pathway eligibility is enabled.')
    if (!requiredArray(input.pillarKeys)) {
      errors.push('At least one pillar is required when Pathway eligibility is enabled.')
    }
    if (!input.studentGoal) {
      errors.push('Student goal is required when Pathway eligibility is enabled.')
    }
    if (!requiredArray(input.growthStageFit)) {
      errors.push('At least one growth stage is required when Pathway eligibility is enabled.')
    }
    if (!requiredArray(input.studentOutcomes)) {
      errors.push('At least one student outcome is required when Pathway eligibility is enabled.')
    }
    if (!input.proofOutcome) {
      errors.push('Proof outcome is required when Pathway eligibility is enabled.')
    }
    if (!requiredArray(evidenceSignals)) {
      errors.push('At least one evidence signal is required when Pathway eligibility is enabled.')
    }
    if (!input.audience) errors.push('Audience is required when Pathway eligibility is enabled.')
    if (!input.ctaType) errors.push('CTA type is required when Pathway eligibility is enabled.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function toUpsertPayload(input: EventPathwayMetadataInput): EventPathwayMetadataRow {
  const now = new Date().toISOString()
  const evidenceSignals = requiredArray(input.evidenceSignals)
    ? input.evidenceSignals
    : deriveEvidenceSignals(input)

  return {
    event_id: input.eventId,
    is_pathway_eligible: input.isPathwayEligible,
    primary_okr: input.primaryOkr ?? null,
    okr_alignment: input.okrAlignment ?? [],
    pillar_keys: input.pillarKeys ?? [],
    student_goal: input.studentGoal ?? null,
    growth_stage_fit: input.growthStageFit ?? [],
    student_outcomes: input.studentOutcomes ?? [],
    proof_outcome: input.proofOutcome ?? null,
    evidence_signals: evidenceSignals,
    audience: input.audience ?? null,
    cta_type: input.ctaType ?? null,
    coordination_risk: input.coordinationRisk ?? 'low',
    recommendation_safety: input.recommendationSafety ?? (input.isPathwayEligible ? 'recommend_only_if_event_active' : 'manual_review'),
    metadata_status: input.metadataStatus ?? (input.isPathwayEligible ? 'ready' : 'draft'),
    notes: input.notes ?? null,
    created_by_id: input.actorUserId,
    updated_by_id: input.actorUserId,
    created_at: now,
    updated_at: now,
  }
}

export const EventPathwayMetadataService = {
  validate: validateEventPathwayMetadataInput,

  async getForEvent(
    supabase: SupabaseClient<Database>,
    eventId: string
  ): Promise<EventPathwayMetadataRow | null> {
    const { data, error } = await supabase
      .from('event_pathway_metadata')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle()

    if (error) {
      logger.error(
        { context: 'EventPathwayMetadataService.getForEvent', eventId, error },
        'Failed to load event Pathway metadata'
      )
      return null
    }

    return (data ?? null) as EventPathwayMetadataRow | null
  },

  async upsertForEvent(
    supabase: SupabaseClient<Database>,
    input: EventPathwayMetadataInput
  ): Promise<{ success: true; data: EventPathwayMetadataRow } | { success: false; error: string }> {
    const validation = validateEventPathwayMetadataInput(input)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(' ') }
    }

    const { data, error } = await supabase
      .from('event_pathway_metadata')
      .upsert(toUpsertPayload(input), { onConflict: 'event_id' })
      .select('*')
      .single()

    if (error) {
      logger.error(
        { context: 'EventPathwayMetadataService.upsertForEvent', eventId: input.eventId, error },
        'Failed to upsert event Pathway metadata'
      )
      return { success: false, error: 'Unable to save event Pathway metadata' }
    }

    return { success: true, data: data as EventPathwayMetadataRow }
  },
}
