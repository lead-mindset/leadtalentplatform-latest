import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  PathwayIntelligenceService,
  generateFallbackPathwayRecommendations,
} from '../pathway-intelligence.service'

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

const ANSWERS = {
  looking_for: 'build_technical_experience',
  current_blocker: 'need_more_experience',
  study_interest: 'AI',
  confidence_level: 3,
  monthly_time_commitment: 'two_to_four_hours',
}

const CLASSIFICATION = {
  growth_stage: 'builder' as const,
  primary_focus: 'technical_experience' as const,
}

function createIntelligenceMock(params: {
  metadata: { data: unknown; error: unknown }
  events?: { data: unknown; error: unknown }
}) {
  const metadataBuilder = {
    select: vi.fn(() => metadataBuilder),
    eq: vi.fn(() => metadataBuilder),
    in: vi.fn(async () => params.metadata),
  }
  const eventBuilder = {
    select: vi.fn(() => eventBuilder),
    in: vi.fn(() => eventBuilder),
    eq: vi.fn(() => eventBuilder),
    gte: vi.fn(() => eventBuilder),
    order: vi.fn(async () => params.events ?? { data: [], error: null }),
  }
  const from = vi.fn((table: string) =>
    table === 'event_pathway_metadata' ? metadataBuilder : eventBuilder
  )

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    metadataBuilder,
    eventBuilder,
  }
}

describe('PathwayIntelligenceService', () => {
  it('builds fixed fallback actions without chapter leader outreach', () => {
    const recommendations = generateFallbackPathwayRecommendations({
      answers: ANSWERS,
      classification: CLASSIFICATION,
    })

    expect(recommendations).toHaveLength(3)
    expect(recommendations.map((recommendation) => recommendation.category)).toEqual([
      'learn',
      'connect',
      'prove',
    ])
    expect(recommendations[1]).toEqual(
      expect.objectContaining({
        source_type: 'profile_action',
        cta_type: 'update_profile',
        evidence_signal: 'profile_updated',
      })
    )
    expect(recommendations.map((recommendation) => recommendation.body).join(' ')).not.toContain(
      'chapter leader'
    )
  })

  it('falls back when no eligible event metadata exists', async () => {
    const { supabase, eventBuilder } = createIntelligenceMock({
      metadata: { data: [], error: null },
    })

    const recommendations = await PathwayIntelligenceService.generateRecommendations(supabase, {
      chapterId: 'chapter-1',
      answers: ANSWERS,
      classification: CLASSIFICATION,
      now: new Date('2026-05-25T20:00:00Z'),
    })

    expect(recommendations[0]).toEqual(
      expect.objectContaining({ category: 'learn', source_type: 'fixed_action' })
    )
    expect(eventBuilder.select).not.toHaveBeenCalled()
  })

  it('prioritizes a same-chapter matching event and stores traceability', async () => {
    const { supabase, metadataBuilder, eventBuilder } = createIntelligenceMock({
      metadata: {
        data: [
          {
            event_id: 'event-other',
            primary_okr: 'empower',
            pillar_keys: ['academic_excellence'],
            student_goal: 'technical_experience',
            growth_stage_fit: ['builder'],
            student_outcomes: ['technical_skill'],
            proof_outcome: 'project_note',
            evidence_signals: ['reflection_completed'],
            audience: 'active_member',
            cta_type: 'register',
            recommendation_safety: 'recommendable_now',
          },
          {
            event_id: 'event-same',
            primary_okr: 'empower',
            pillar_keys: ['professional_development'],
            student_goal: 'technical_experience',
            growth_stage_fit: ['builder'],
            student_outcomes: ['proof_artifact'],
            proof_outcome: 'project_note',
            evidence_signals: ['event_registration', 'reflection_completed'],
            audience: 'active_member',
            cta_type: 'register',
            recommendation_safety: 'recommendable_now',
          },
        ],
        error: null,
      },
      events: {
        data: [
          {
            id: 'event-other',
            title: 'AI Workshop',
            description: 'Learn AI',
            chapter_id: 'chapter-2',
            start_at: '2026-06-01T20:00:00Z',
            access_model: 'open',
            is_published: true,
          },
          {
            id: 'event-same',
            title: 'Product Sprint LEAD',
            description: 'Build a project',
            chapter_id: 'chapter-1',
            start_at: '2026-06-02T20:00:00Z',
            access_model: 'open',
            is_published: true,
          },
        ],
        error: null,
      },
    })

    const recommendations = await PathwayIntelligenceService.generateRecommendations(supabase, {
      chapterId: 'chapter-1',
      answers: ANSWERS,
      classification: CLASSIFICATION,
      now: new Date('2026-05-25T20:00:00Z'),
    })

    expect(recommendations[0]).toEqual(
      expect.objectContaining({
        category: 'learn',
        title: 'Register for Product Sprint LEAD',
        source_type: 'event',
        source_event_id: 'event-same',
        cta_type: 'register',
        evidence_signal: 'event_registration',
      })
    )
    expect(recommendations[0].matched_reasons).toContain('Matches your technical experience goal.')
    expect(recommendations[0].matched_reasons).toContain('Available through your chapter context.')
    expect(metadataBuilder.eq).toHaveBeenCalledWith('metadata_status', 'ready')
    expect(eventBuilder.gte).toHaveBeenCalledWith('start_at', '2026-05-25T20:00:00.000Z')
  })

  it('uses application language without promising access', async () => {
    const { supabase } = createIntelligenceMock({
      metadata: {
        data: [
          {
            event_id: 'event-application',
            primary_okr: 'elevate',
            pillar_keys: ['professional_development'],
            student_goal: 'technical_experience',
            growth_stage_fit: ['builder'],
            student_outcomes: ['professional_readiness'],
            proof_outcome: 'reflection',
            evidence_signals: ['application_submitted'],
            audience: 'application_required',
            cta_type: 'apply',
            recommendation_safety: 'recommendable_now',
          },
        ],
        error: null,
      },
      events: {
        data: [
          {
            id: 'event-application',
            title: 'Microsoft Visit',
            description: 'Apply to join',
            chapter_id: 'chapter-1',
            start_at: '2026-06-01T20:00:00Z',
            access_model: 'application',
            is_published: true,
          },
        ],
        error: null,
      },
    })

    const recommendations = await PathwayIntelligenceService.generateRecommendations(supabase, {
      chapterId: 'chapter-1',
      answers: ANSWERS,
      classification: CLASSIFICATION,
      now: new Date('2026-05-25T20:00:00Z'),
    })

    expect(recommendations[0]).toEqual(
      expect.objectContaining({
        title: 'Apply for Microsoft Visit',
        cta_type: 'apply',
        evidence_signal: 'application_submitted',
      })
    )
    expect(recommendations[0].body).toContain('does not guarantee a spot')
  })
})
