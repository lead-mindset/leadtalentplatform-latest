export const LEAD_OKR_KEYS = ['inspire', 'unite', 'empower', 'elevate'] as const

export const LEAD_PILLAR_KEYS = [
  'lead_academia',
  'academic_excellence',
  'womens_excellence',
  'professional_development',
  'leadership_development',
  'community_outreach',
  'chapter_development',
] as const

export const PATHWAY_PRIMARY_FOCUS_KEYS = [
  'career_exploration',
  'technical_experience',
  'opportunity_readiness',
  'community_mentorship',
  'leadership',
] as const

export const PATHWAY_GROWTH_STAGE_KEYS = [
  'explorer',
  'builder',
  'leader',
  'candidate',
  'emerging_professional',
] as const

export const LEAD_STUDENT_OUTCOME_KEYS = [
  'mission_orientation',
  'belonging',
  'career_exposure',
  'technical_skill',
  'innovation_project',
  'proof_artifact',
  'professional_readiness',
  'profile_visibility',
  'leadership_confidence',
  'teamwork',
  'reflection',
  'community_service',
] as const

export const LEAD_PROOF_OUTCOME_KEYS = [
  'none',
  'reflection',
  'certificate',
  'pitch_deck',
  'linkedin_update',
  'resume_bullet',
  'project_note',
  'portfolio_item',
] as const

export const LEAD_EVIDENCE_SIGNAL_KEYS = [
  'event_registration',
  'event_attendance',
  'application_submitted',
  'reflection_completed',
  'proof_submitted',
  'certificate_earned',
  'linkedin_updated',
  'resume_updated',
  'profile_updated',
  'mission_recap_completed',
] as const

export const LEAD_RECOMMENDATION_CTA_TYPES = [
  'register',
  'apply',
  'attend',
  'reflect',
  'update_profile',
  'update_linkedin',
  'update_resume',
  'capture_proof',
] as const

export const LEAD_RECOMMENDATION_SOURCE_TYPES = [
  'event',
  'profile_action',
  'proof_action',
  'fixed_action',
] as const

export const LEAD_EVENT_AUDIENCE_KEYS = [
  'new_member',
  'active_member',
  'chapter_leader',
  'all_students',
  'application_required',
  'open_public',
  'chapter_only',
] as const

export const LEAD_COORDINATION_RISK_KEYS = ['low', 'medium', 'high'] as const

export const LEAD_RECOMMENDATION_SAFETY_KEYS = [
  'recommendable_now',
  'recommend_only_if_event_active',
  'manual_review',
  'not_recommendable',
] as const

export const EVENT_PATHWAY_METADATA_STATUSES = ['draft', 'ready', 'archived'] as const

export type LeadOkrKey = (typeof LEAD_OKR_KEYS)[number]
export type LeadPillarKey = (typeof LEAD_PILLAR_KEYS)[number]
export type PathwayPrimaryFocusKey = (typeof PATHWAY_PRIMARY_FOCUS_KEYS)[number]
export type PathwayGrowthStageKey = (typeof PATHWAY_GROWTH_STAGE_KEYS)[number]
export type LeadStudentOutcomeKey = (typeof LEAD_STUDENT_OUTCOME_KEYS)[number]
export type LeadProofOutcomeKey = (typeof LEAD_PROOF_OUTCOME_KEYS)[number]
export type LeadEvidenceSignalKey = (typeof LEAD_EVIDENCE_SIGNAL_KEYS)[number]
export type LeadRecommendationCtaType = (typeof LEAD_RECOMMENDATION_CTA_TYPES)[number]
export type LeadRecommendationSourceType = (typeof LEAD_RECOMMENDATION_SOURCE_TYPES)[number]
export type LeadEventAudienceKey = (typeof LEAD_EVENT_AUDIENCE_KEYS)[number]
export type LeadCoordinationRiskKey = (typeof LEAD_COORDINATION_RISK_KEYS)[number]
export type LeadRecommendationSafetyKey = (typeof LEAD_RECOMMENDATION_SAFETY_KEYS)[number]
export type EventPathwayMetadataStatus = (typeof EVENT_PATHWAY_METADATA_STATUSES)[number]
