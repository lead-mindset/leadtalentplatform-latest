import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from '../create-event'
import { requireChapterEditor } from '@/lib/auth'
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service'
import { EventApplicationService } from '@/lib/services/event-application.service'
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
})
