import { z } from 'zod'
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
} from '@/lib/lead-taxonomy'
import type { EventPathwayMetadataInput } from '@/lib/services/event-pathway-metadata.service'

export const EventPathwayMetadataActionSchema = z.object({
  isPathwayEligible: z.boolean(),
  primaryOkr: z.enum(LEAD_OKR_KEYS).nullable().optional(),
  okrAlignment: z.array(z.enum(LEAD_OKR_KEYS)).optional(),
  pillarKeys: z.array(z.enum(LEAD_PILLAR_KEYS)).optional(),
  studentGoal: z.enum(PATHWAY_PRIMARY_FOCUS_KEYS).nullable().optional(),
  growthStageFit: z.array(z.enum(PATHWAY_GROWTH_STAGE_KEYS)).optional(),
  studentOutcomes: z.array(z.enum(LEAD_STUDENT_OUTCOME_KEYS)).optional(),
  proofOutcome: z.enum(LEAD_PROOF_OUTCOME_KEYS).nullable().optional(),
  evidenceSignals: z.array(z.enum(LEAD_EVIDENCE_SIGNAL_KEYS)).optional(),
  audience: z.enum(LEAD_EVENT_AUDIENCE_KEYS).nullable().optional(),
  ctaType: z.enum(LEAD_RECOMMENDATION_CTA_TYPES).nullable().optional(),
  coordinationRisk: z.enum(LEAD_COORDINATION_RISK_KEYS).optional(),
  recommendationSafety: z.enum(LEAD_RECOMMENDATION_SAFETY_KEYS).optional(),
  metadataStatus: z.enum(EVENT_PATHWAY_METADATA_STATUSES).optional(),
  notes: z.string().max(1000).nullable().optional(),
})

export type EventPathwayMetadataActionInput = z.infer<typeof EventPathwayMetadataActionSchema>

export function toEventPathwayMetadataInput({
  payload,
  eventId,
  actorUserId,
}: {
  payload: EventPathwayMetadataActionInput | undefined
  eventId: string
  actorUserId: string
}): EventPathwayMetadataInput | null {
  if (!payload) return null

  return {
    eventId,
    actorUserId,
    isPathwayEligible: payload.isPathwayEligible,
    primaryOkr: payload.primaryOkr ?? null,
    okrAlignment: payload.okrAlignment ?? [],
    pillarKeys: payload.pillarKeys ?? [],
    studentGoal: payload.studentGoal ?? null,
    growthStageFit: payload.growthStageFit ?? [],
    studentOutcomes: payload.studentOutcomes ?? [],
    proofOutcome: payload.proofOutcome ?? null,
    evidenceSignals: payload.evidenceSignals ?? [],
    audience: payload.audience ?? null,
    ctaType: payload.ctaType ?? null,
    coordinationRisk: payload.coordinationRisk ?? 'low',
    recommendationSafety: payload.recommendationSafety ?? 'manual_review',
    metadataStatus: payload.metadataStatus ?? 'draft',
    notes: payload.notes?.trim() ? payload.notes.trim() : null,
  }
}
