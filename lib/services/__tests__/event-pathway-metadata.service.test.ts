import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  EventPathwayMetadataService,
  validateEventPathwayMetadataInput,
  type EventPathwayMetadataInput,
} from '../event-pathway-metadata.service'

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

const VALID_INPUT: EventPathwayMetadataInput = {
  eventId: 'event-1',
  actorUserId: 'user-1',
  isPathwayEligible: true,
  primaryOkr: 'empower',
  okrAlignment: ['empower', 'elevate'],
  pillarKeys: ['academic_excellence', 'professional_development'],
  studentGoal: 'technical_experience',
  growthStageFit: ['builder', 'candidate'],
  studentOutcomes: ['technical_skill', 'proof_artifact'],
  proofOutcome: 'project_note',
  evidenceSignals: ['event_registration', 'reflection_completed'],
  audience: 'active_member',
  ctaType: 'register',
  coordinationRisk: 'low',
  recommendationSafety: 'recommendable_now',
  metadataStatus: 'ready',
  notes: 'Good fit for students seeking technical proof.',
}

function createUpsertMock(result: { data: unknown; error: unknown }) {
  const builder = {
    upsert: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => result),
  }

  return {
    supabase: {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient<Database>,
    builder,
  }
}

describe('EventPathwayMetadataService', () => {
  it('requires core metadata when Pathway eligibility is enabled', () => {
    const validation = validateEventPathwayMetadataInput({
      eventId: 'event-1',
      actorUserId: 'user-1',
      isPathwayEligible: true,
    })

    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain(
      'Primary OKR is required when Pathway eligibility is enabled.'
    )
    expect(validation.errors).toContain(
      'At least one pillar is required when Pathway eligibility is enabled.'
    )
    expect(validation.errors).toContain(
      'CTA type is required when Pathway eligibility is enabled.'
    )
    expect(validation.errors).toContain(
      'Recommendation safety is required when Pathway eligibility is enabled.'
    )
  })

  it('accepts complete SharePoint-grounded event metadata', () => {
    expect(validateEventPathwayMetadataInput(VALID_INPUT)).toEqual({
      valid: true,
      errors: [],
    })
  })

  it('rejects invalid taxonomy values before writing to Supabase', async () => {
    const { supabase, builder } = createUpsertMock({ data: null, error: null })

    await expect(
      EventPathwayMetadataService.upsertForEvent(supabase, {
        ...VALID_INPUT,
        primaryOkr: 'invalid' as EventPathwayMetadataInput['primaryOkr'],
      })
    ).resolves.toEqual({
      success: false,
      error: 'Primary OKR is not a valid LEAD OKR.',
    })

    expect(builder.upsert).not.toHaveBeenCalled()
  })

  it('upserts normalized metadata for an event', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-25T20:00:00Z'))
    const row = {
      event_id: 'event-1',
      is_pathway_eligible: true,
    }
    const { supabase, builder } = createUpsertMock({ data: row, error: null })

    await expect(EventPathwayMetadataService.upsertForEvent(supabase, VALID_INPUT)).resolves.toEqual({
      success: true,
      data: row,
    })

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 'event-1',
        is_pathway_eligible: true,
        primary_okr: 'empower',
        pillar_keys: ['academic_excellence', 'professional_development'],
        created_by_id: 'user-1',
        updated_by_id: 'user-1',
        updated_at: '2026-05-25T20:00:00.000Z',
      }),
      { onConflict: 'event_id' }
    )
    vi.useRealTimers()
  })
})
