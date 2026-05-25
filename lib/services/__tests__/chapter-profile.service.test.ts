import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ChapterProfileService } from '../chapter-profile.service'

interface MockChain {
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lt: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

interface TableMock {
  select: ReturnType<typeof vi.fn>
  _selectChain: MockChain
}

const buildChain = (): MockChain => ({
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [], error: null }),
  maybeSingle: vi.fn(),
  then: vi.fn((resolve: (value: unknown) => unknown) => resolve({ data: [], error: null, count: 0 })),
})

const buildMockSupabase = () => {
  const tableMocks: Record<string, TableMock> = {
    chapter: {
      select: vi.fn().mockReturnValue(buildChain()),
      _selectChain: buildChain(),
    },
    event: {
      select: vi.fn().mockReturnValue(buildChain()),
      _selectChain: buildChain(),
    },
    chapter_membership: {
      select: vi.fn().mockReturnValue(buildChain()),
      _selectChain: buildChain(),
    },
    person_profile: {
      select: vi.fn().mockReturnValue(buildChain()),
      _selectChain: buildChain(),
    },
    user: {
      select: vi.fn().mockReturnValue(buildChain()),
      _selectChain: buildChain(),
    },
  }

  for (const mock of Object.values(tableMocks)) {
    mock._selectChain = buildChain()
    mock.select.mockReturnValue(mock._selectChain)
  }

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient

  return { mockSupabase, tableMocks }
}

describe('ChapterProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves a public-safe chapter profile with events, counts, and team preview', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.chapter._selectChain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'leadupc',
        name: 'LEAD UPC',
        university: 'Universidad Peruana de Ciencias Aplicadas',
        city: 'Lima',
        region: 'Lima',
        instagram_url: 'https://instagram.com/leadupc',
        latitude: -12.1,
        longitude: -77.1,
      },
      error: null,
    })
    tableMocks.event._selectChain.then
      .mockImplementationOnce((resolve: (value: unknown) => unknown) => resolve({
        data: [{
          id: 'evt-1',
          title: 'Leadership Night',
          description: 'A chapter event',
          start_at: '2026-10-01T00:00:00.000Z',
          end_at: '2026-10-01T02:00:00.000Z',
          location: null,
          location_name: 'UPC Campus',
          location_city: 'Lima',
          cover_image: null,
          event_type: 'in_person',
          capacity: 50,
          event_registration: [{ count: 12 }],
        }],
        error: null,
      }))
      .mockImplementationOnce((resolve: (value: unknown) => unknown) => resolve({
        data: null,
        error: null,
        count: 3,
      }))
    tableMocks.chapter_membership._selectChain.then
      .mockImplementationOnce((resolve: (value: unknown) => unknown) => resolve({
        data: null,
        error: null,
        count: 2,
      }))
      .mockImplementationOnce((resolve: (value: unknown) => unknown) => resolve({
        data: [{
          user_id: 'user-1',
          member_id: 'LEAD-000001',
          position: 'president',
        }],
        error: null,
      }))
    tableMocks.person_profile._selectChain.in.mockResolvedValueOnce({
      data: [{ user_id: 'user-1', major_or_interest: 'International Business' }],
      error: null,
    })
    tableMocks.user._selectChain.in.mockResolvedValueOnce({
      data: [{
        id: 'user-1',
        name: 'Alexandra Cuchula',
        email: 'alexandra@example.com',
      }],
      error: null,
    })

    const result = await ChapterProfileService.getPublicChapterProfile(
      mockSupabase as unknown as SupabaseClient,
      'leadupc'
    )

    expect(result?.chapter.name).toBe('LEAD UPC')
    expect(result?.events[0].registration_count).toBe(12)
    expect(result?.stats.approvedMemberCount).toBe(2)
    expect(result?.stats.pastEventsCount).toBe(3)
    expect(result?.teamPreview[0]).toEqual({
      user_id: 'user-1',
      name: 'Alexandra Cuchula',
      major_or_interest: 'International Business',
      chapter_position: 'president',
      member_id: 'LEAD-000001',
    })
    expect(JSON.stringify(result)).not.toContain('alexandra@example.com')
    expect(JSON.stringify(result)).not.toContain('@')
  })

  it('returns null when the chapter is missing', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.chapter._selectChain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await ChapterProfileService.getPublicChapterProfile(
      mockSupabase as unknown as SupabaseClient,
      'missing'
    )

    expect(result).toBeNull()
  })

  it('returns usable empty state flags for sparse chapters', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.chapter._selectChain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'leadnew',
        name: 'LEAD New',
        university: 'New University',
        city: null,
        region: null,
        instagram_url: null,
        latitude: null,
        longitude: null,
      },
      error: null,
    })

    const result = await ChapterProfileService.getPublicChapterProfile(
      mockSupabase as unknown as SupabaseClient,
      'leadnew'
    )

    expect(result?.events).toEqual([])
    expect(result?.teamPreview).toEqual([])
    expect(result?.stats.approvedMemberCount).toBe(0)
    expect(result?.stats.pastEventsCount).toBe(0)
    expect(result?.emptyStates).toEqual({
      hasUpcomingEvents: false,
      hasTeamPreview: false,
    })
  })

  it('does not request profiles when there are no approved memberships', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.chapter._selectChain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'leadempty',
        name: 'LEAD Empty',
        university: 'Empty University',
        city: null,
        region: null,
        instagram_url: null,
        latitude: null,
        longitude: null,
      },
      error: null,
    })

    await ChapterProfileService.getPublicChapterProfile(
      mockSupabase as unknown as SupabaseClient,
      'leadempty'
    )

    expect(tableMocks.person_profile.select).not.toHaveBeenCalled()
    expect(tableMocks.user.select).not.toHaveBeenCalled()
  })

  it('resolves a public chapter directory with reliable activity counts', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.chapter._selectChain.then.mockImplementationOnce(
      (resolve: (value: unknown) => unknown) => resolve({
        data: [
          {
            id: 'leadupc',
            name: 'LEAD UPC',
            university: 'Universidad Peruana de Ciencias Aplicadas',
            city: 'Lima',
            region: 'Lima',
          },
          {
            id: 'leadutec',
            name: 'LEAD UTEC',
            university: 'Universidad de Ingenieria y Tecnologia',
            city: 'Lima',
            region: null,
          },
        ],
        error: null,
      })
    )
    tableMocks.chapter_membership._selectChain.in.mockResolvedValueOnce({
      data: [
        { chapter_id: 'leadupc' },
        { chapter_id: 'leadupc' },
        { chapter_id: 'leadutec' },
      ],
      error: null,
    })
    tableMocks.event._selectChain.in.mockResolvedValueOnce({
      data: [
        { chapter_id: 'leadupc' },
        { chapter_id: 'leadupc' },
      ],
      error: null,
    })

    const result = await ChapterProfileService.getPublicChapterDirectory(
      mockSupabase as unknown as SupabaseClient
    )

    expect(result.stats).toEqual({
      totalChapters: 2,
      totalApprovedMembers: 3,
      totalUpcomingEvents: 2,
    })
    expect(result.chapters[0]).toMatchObject({
      id: 'leadupc',
      name: 'LEAD UPC',
      approvedMemberCount: 2,
      upcomingEventsCount: 2,
      hasLocation: true,
      hasActivity: true,
    })
    expect(result.emptyStates.hasChapters).toBe(true)
  })

  it('keeps sparse chapter directory rows usable', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.chapter._selectChain.then.mockImplementationOnce(
      (resolve: (value: unknown) => unknown) => resolve({
        data: [
          {
            id: 'leadnew',
            name: 'LEAD New',
            university: 'New University',
            city: null,
            region: null,
          },
        ],
        error: null,
      })
    )
    tableMocks.chapter_membership._selectChain.in.mockResolvedValueOnce({
      data: [],
      error: null,
    })
    tableMocks.event._selectChain.in.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const result = await ChapterProfileService.getPublicChapterDirectory(
      mockSupabase as unknown as SupabaseClient
    )

    expect(result.chapters[0]).toMatchObject({
      id: 'leadnew',
      approvedMemberCount: 0,
      upcomingEventsCount: 0,
      hasLocation: false,
      hasActivity: false,
    })
  })
})
