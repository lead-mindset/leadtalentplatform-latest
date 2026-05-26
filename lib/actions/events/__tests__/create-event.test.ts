import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from '../create-event'
import { requireChapterEditor } from '@/lib/auth'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { EventApplicationService } from '@/lib/services/event-application.service'
import { EventPathwayMetadataService } from '@/lib/services/event-pathway-metadata.service'
import { EventService } from '@/lib/services/event.service'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (callback: unknown) => callback,
}))

vi.mock('@/lib/auth', () => ({
  requireChapterEditor: vi.fn(),
}))

vi.mock('@/lib/services/chapter-permission.service', () => ({
  ChapterPermissionService: {
    requireChapterPermission: vi.fn(),
  },
}))

vi.mock('@/lib/services/event.service', () => ({
  EventService: {
    createEvent: vi.fn(),
    deleteEvent: vi.fn(),
  },
}))

vi.mock('@/lib/services/event-application.service', () => ({
  EventApplicationService: {
    upsertQuestionsForEvent: vi.fn(),
  },
}))

vi.mock('@/lib/services/event-pathway-metadata.service', () => ({
  EventPathwayMetadataService: {
    upsertForEvent: vi.fn(),
  },
}))

const baseInput = {
  title: 'Draft event',
  startAt: '2026-06-01T15:00',
  endAt: '2026-06-01T17:00',
  eventType: 'in_person' as const,
  accessModel: 'application' as const,
}

describe('createEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireChapterEditor).mockResolvedValue({
      supabase: {},
      user: { id: 'eboard-1', role: 'member' },
      chapter_id: 'leaduni',
      membership: { chapter_id: 'leaduni' },
    } as never)
    vi.mocked(ChapterPermissionService.requireChapterPermission).mockResolvedValue({ success: true })
    vi.mocked(EventService.createEvent).mockResolvedValue({
      id: 'event-1',
      title: 'Draft event',
      is_published: false,
    } as never)
    vi.mocked(EventApplicationService.upsertQuestionsForEvent).mockResolvedValue({ success: true })
    vi.mocked(EventPathwayMetadataService.upsertForEvent).mockResolvedValue({
      success: true,
      data: { event_id: 'event-1' },
    } as never)
  })

  it('allows application events to be saved as drafts before questions are complete', async () => {
    const result = await createEvent({
      ...baseInput,
      isPublished: false,
      applicationQuestions: [],
    })

    expect(result).toEqual({
      success: true,
      event: expect.objectContaining({ id: 'event-1' }),
    })
    expect(EventApplicationService.upsertQuestionsForEvent).toHaveBeenCalledWith({}, {
      eventId: 'event-1',
      questions: [],
      requireCompleteQuestions: false,
    })
    expect(EventPathwayMetadataService.upsertForEvent).not.toHaveBeenCalled()
  })

  it('blocks publishing an application event without at least one question', async () => {
    const result = await createEvent({
      ...baseInput,
      isPublished: true,
      applicationQuestions: [],
    })

    expect(result).toEqual({ error: 'Validation failed' })
    expect(EventService.createEvent).not.toHaveBeenCalled()
  })

  it('persists Pathway metadata when provided', async () => {
    const result = await createEvent({
      ...baseInput,
      accessModel: 'open',
      isPublished: false,
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
    expect(EventPathwayMetadataService.upsertForEvent).toHaveBeenCalledWith({}, expect.objectContaining({
      eventId: 'event-1',
      actorUserId: 'eboard-1',
      isPathwayEligible: true,
      primaryOkr: 'empower',
      pillarKeys: ['professional_development'],
      evidenceSignals: undefined,
      recommendationSafety: undefined,
      metadataStatus: undefined,
    }))
  })

  it('removes the created event if Pathway metadata cannot be saved', async () => {
    vi.mocked(EventPathwayMetadataService.upsertForEvent).mockResolvedValueOnce({
      success: false,
      error: 'Unable to save event Pathway metadata',
    })

    const result = await createEvent({
      ...baseInput,
      accessModel: 'open',
      isPublished: false,
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
      error: 'Unable to save event Pathway metadata',
    })
    expect(EventService.deleteEvent).toHaveBeenCalledWith({}, 'event-1')
  })
})
