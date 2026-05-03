import { describe, expect, it, vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { NewsletterSubscriptionService } from '../newsletter-subscription.service'

type QueryResult = { data: unknown; error: unknown }

function createChain(result: QueryResult = { data: null, error: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: QueryResult) => unknown) => resolve(result),
  }

  return chain
}

function buildMockSupabase() {
  const newsletterSelect = createChain()
  const newsletterUpdate = createChain({ data: null, error: null })
  const newsletterInsert = createChain({ data: null, error: null })
  const newsletterList = createChain({ data: [], error: null })
  const eventSelect = createChain({ data: null, error: null })
  const eventChapterSelect = createChain({ data: [], error: null })

  const tableMocks = {
    newsletter_subscription: {
      select: vi.fn(() => newsletterSelect),
      update: vi.fn(() => newsletterUpdate),
      insert: vi.fn(() => newsletterInsert),
      chains: { newsletterSelect, newsletterUpdate, newsletterInsert, newsletterList },
    },
    event: {
      select: vi.fn(() => eventSelect),
      chains: { eventSelect },
    },
    event_chapter: {
      select: vi.fn(() => eventChapterSelect),
      chains: { eventChapterSelect },
    },
  }

  const mockSupabase = {
    from: vi.fn((table: keyof typeof tableMocks) => tableMocks[table]),
  }

  return { mockSupabase: mockSupabase as unknown as SupabaseClient, tableMocks }
}

describe('NewsletterSubscriptionService', () => {
  it('creates an active global subscription when none exists', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.newsletter_subscription.chains.newsletterSelect.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await NewsletterSubscriptionService.subscribeGlobal(mockSupabase, {
      userId: 'user-1',
      source: 'onboarding',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.newsletter_subscription.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        scope: 'global',
        chapter_id: null,
        status: 'active',
        source: 'onboarding',
        unsubscribed_at: null,
      })
    )
  })

  it('reactivates an existing global subscription', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.newsletter_subscription.chains.newsletterSelect.maybeSingle.mockResolvedValueOnce({
      data: { id: 'sub-1' },
      error: null,
    })

    const result = await NewsletterSubscriptionService.subscribeGlobal(mockSupabase, {
      userId: 'user-1',
      source: 'onboarding',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.newsletter_subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        source: 'onboarding',
        unsubscribed_at: null,
      })
    )
    expect(tableMocks.newsletter_subscription.chains.newsletterUpdate.eq).toHaveBeenCalledWith('id', 'sub-1')
  })

  it('creates a chapter subscription with chapter scope', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.newsletter_subscription.chains.newsletterSelect.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await NewsletterSubscriptionService.subscribeToChapter(mockSupabase, {
      userId: 'user-1',
      chapterId: 'leaduni',
      source: 'onboarding',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.newsletter_subscription.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        scope: 'chapter',
        chapter_id: 'leaduni',
        status: 'active',
      })
    )
  })

  it('deduplicates batch chapter subscriptions', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.newsletter_subscription.chains.newsletterSelect.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await NewsletterSubscriptionService.subscribeToChapters(mockSupabase, {
      userId: 'user-1',
      chapterIds: ['leaduni', 'leaduni', 'leadutec'],
      source: 'event_registration',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.newsletter_subscription.insert).toHaveBeenCalledTimes(2)
  })

  it('marks subscriptions unsubscribed without deleting them', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    const result = await NewsletterSubscriptionService.unsubscribe(mockSupabase, {
      userId: 'user-1',
      scope: 'chapter',
      chapterId: 'leaduni',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.newsletter_subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'unsubscribed',
        unsubscribed_at: expect.any(String),
      })
    )
    expect(tableMocks.newsletter_subscription.chains.newsletterUpdate.eq).toHaveBeenCalledWith('chapter_id', 'leaduni')
  })

  it('returns event owner and collaborator chapter ids', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.event.chains.eventSelect.maybeSingle.mockResolvedValueOnce({
      data: { id: 'evt-1', chapter_id: 'leaduni' },
      error: null,
    })
    tableMocks.event_chapter.chains.eventChapterSelect.then = (resolve: (value: QueryResult) => unknown) =>
      resolve({
        data: [{ chapter_id: 'leadutec' }, { chapter_id: 'leaduni' }],
        error: null,
      })

    const result = await NewsletterSubscriptionService.getEventChapterIds(mockSupabase, 'evt-1')

    expect(result).toEqual(['leaduni', 'leadutec'])
  })

  it('subscribes to event owner and collaborator chapters for registration', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.event.chains.eventSelect.maybeSingle.mockResolvedValueOnce({
      data: { id: 'evt-1', chapter_id: 'leaduni' },
      error: null,
    })
    tableMocks.event_chapter.chains.eventChapterSelect.then = (resolve: (value: QueryResult) => unknown) =>
      resolve({
        data: [{ chapter_id: 'leadutec' }],
        error: null,
      })
    tableMocks.newsletter_subscription.chains.newsletterSelect.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await NewsletterSubscriptionService.subscribeForEventRegistration(mockSupabase, {
      userId: 'user-1',
      eventId: 'evt-1',
    })

    expect(result).toEqual({ success: true })
    expect(tableMocks.newsletter_subscription.insert).toHaveBeenCalledTimes(2)
  })

  it('returns a friendly error when lookup fails', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.newsletter_subscription.chains.newsletterSelect.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'database unavailable' },
    })

    const result = await NewsletterSubscriptionService.subscribeGlobal(mockSupabase, {
      userId: 'user-1',
    })

    expect(result).toEqual({ success: false, error: 'database unavailable' })
  })
})
