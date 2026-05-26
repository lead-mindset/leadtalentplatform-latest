import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateEvent } from '../update-event'
import { assertCanManageEvent } from '../access'
import { EventApplicationService } from '@/lib/services/event-application.service'
import { EventPathwayMetadataService } from '@/lib/services/event-pathway-metadata.service'
import { EventService } from '@/lib/services/event.service'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (callback: unknown) => callback,
}))

vi.mock('../access', () => ({
  assertCanManageEvent: vi.fn(),
}))

vi.mock('@/lib/services/event.service', () => ({
  EventService: {
    updateEvent: vi.fn(),
  },
}))

vi.mock('@/lib/services/event-application.service', () => ({
  EventApplicationService: {
    upsertQuestionsForEvent: vi.fn(),
  },
}))

vi.mock('@/lib/services/event-pathway-metadata.service', () => ({
  EventPathwayMetadataService: {
    validate: vi.fn(),
    upsertForEvent: vi.fn(),
  },
}))

describe('updateEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assertCanManageEvent).mockResolvedValue({
      supabase: {},
      user: { id: 'eboard-1', role: 'member' },
      event: { id: 'event-1', chapter_id: 'leaduni' },
    } as never)
    vi.mocked(EventService.updateEvent).mockResolvedValue({
      id: 'event-1',
      title: 'Updated event',
    } as never)
    vi.mocked(EventApplicationService.upsertQuestionsForEvent).mockResolvedValue({ success: true })
    vi.mocked(EventPathwayMetadataService.validate).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(EventPathwayMetadataService.upsertForEvent).mockResolvedValue({
      success: true,
      data: { event_id: 'event-1' },
    } as never)
  })

  it('validates and saves Pathway metadata through the service layer', async () => {
    const result = await updateEvent({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Updated event',
      pathwayMetadata: {
        isPathwayEligible: true,
        primaryOkr: 'empower',
        pillarKeys: ['professional_development'],
        studentGoal: 'opportunity_readiness',
        growthStageFit: ['candidate'],
        studentOutcomes: ['professional_readiness'],
        proofOutcome: 'reflection',
        audience: 'active_member',
        ctaType: 'register',
      },
    })

    expect(result).toEqual({
      success: true,
      event: expect.objectContaining({ id: 'event-1' }),
    })
    expect(EventPathwayMetadataService.validate).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-1',
      actorUserId: 'eboard-1',
      isPathwayEligible: true,
    }))
    expect(EventPathwayMetadataService.upsertForEvent).toHaveBeenCalledWith({}, expect.objectContaining({
      eventId: 'event-1',
      primaryOkr: 'empower',
      evidenceSignals: undefined,
      recommendationSafety: undefined,
      metadataStatus: undefined,
    }))
  })

  it('blocks event updates when Pathway metadata is invalid', async () => {
    vi.mocked(EventPathwayMetadataService.validate).mockReturnValueOnce({
      valid: false,
      errors: ['Recommendation safety is required when Pathway eligibility is enabled.'],
    })

    const result = await updateEvent({
      id: '11111111-1111-4111-8111-111111111111',
      pathwayMetadata: {
        isPathwayEligible: true,
        primaryOkr: 'empower',
        pillarKeys: ['professional_development'],
        studentGoal: 'opportunity_readiness',
        growthStageFit: ['candidate'],
        studentOutcomes: ['professional_readiness'],
        proofOutcome: 'reflection',
        evidenceSignals: ['event_registration'],
        audience: 'active_member',
        ctaType: 'register',
      },
    })

    expect(result).toEqual({
      error: 'Recommendation safety is required when Pathway eligibility is enabled.',
    })
    expect(EventService.updateEvent).not.toHaveBeenCalled()
    expect(EventPathwayMetadataService.upsertForEvent).not.toHaveBeenCalled()
  })
})
