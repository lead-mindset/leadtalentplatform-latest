import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteEvent } from '../delete-event'
import { assertCanAccessEvent } from '../access'
import { EventService } from '@/lib/services/event.service'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('../access', () => ({
  assertCanAccessEvent: vi.fn(),
}))

vi.mock('@/lib/services/event.service', () => ({
  EventService: {
    deleteEvent: vi.fn(),
  },
}))

describe('event delete server action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects direct event archive calls without archive permission', async () => {
    vi.mocked(assertCanAccessEvent).mockResolvedValue({ error: 'Insufficient permissions' })

    const result = await deleteEvent('event-1')

    expect(result).toEqual({ error: 'Insufficient permissions' })
    expect(assertCanAccessEvent).toHaveBeenCalledWith('event-1', 'chapter.events.archive')
    expect(EventService.deleteEvent).not.toHaveBeenCalled()
  })

  it('passes actor and chapter audit context when archive is authorized', async () => {
    vi.mocked(assertCanAccessEvent).mockResolvedValue({
      supabase: {},
      user: { id: 'president-1', role: 'member' },
      event: {
        id: 'event-1',
        chapter_id: 'leaduni',
        capacity: 100,
        title: 'Launch Event',
        access_model: 'open',
      },
    } as never)
    vi.mocked(EventService.deleteEvent).mockResolvedValue({ success: true })

    const result = await deleteEvent('event-1')

    expect(result).toEqual({ success: true })
    expect(EventService.deleteEvent).toHaveBeenCalledWith({}, 'event-1', {
      actorUserId: 'president-1',
      chapterId: 'leaduni',
      title: 'Launch Event',
    })
  })
})
