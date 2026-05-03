import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  getEventOnboardingPath,
  getEventRegistrationPreflight,
} from '@/lib/actions/events/register.helpers'

interface TableMock {
  select?: ReturnType<typeof vi.fn>
  eq?: ReturnType<typeof vi.fn>
  single?: ReturnType<typeof vi.fn>
  maybeSingle?: ReturnType<typeof vi.fn>
}

function buildMockSupabase() {
  const tableMocks: Record<string, TableMock> = {
    user: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    },
    person_profile: {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    },
    chapter_membership: {
      select: vi.fn(),
    },
  }

  const mockSupabase = {
    from: vi.fn((table: string) => tableMocks[table]),
  } as unknown as SupabaseClient<Database>

  return { mockSupabase, tableMocks }
}

describe('event registration preflight', () => {
  it('passes when the user has a person_profile', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.user.maybeSingle?.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'participant@test.com',
        name: 'Participant',
        phone: '+1 555 0000',
      },
      error: null,
    })
    tableMocks.person_profile.single?.mockResolvedValue({
      data: {
        user_id: 'user-123',
        university: 'LEAD University',
        major_or_interest: 'Design',
        graduation_year: 2028,
        linkedin_url: 'https://linkedin.com/in/participant',
        portfolio_url: null,
        skills: ['Research'],
        gender: 'prefer_not_to_say',
        is_recruiter_visible: false,
      },
      error: null,
    })

    await expect(
      getEventRegistrationPreflight(mockSupabase, {
        userId: 'user-123',
        eventId: 'event-123',
      })
    ).resolves.toEqual({ ok: true })

    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
    expect(tableMocks.chapter_membership.select).not.toHaveBeenCalled()
  })

  it('routes to onboarding when the person_profile row is missing', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.user.maybeSingle?.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'participant@test.com',
        name: 'Participant',
        phone: '+1 555 0000',
      },
      error: null,
    })
    tableMocks.person_profile.single?.mockResolvedValue({
      data: null,
      error: { message: 'No rows found' },
    })

    const result = await getEventRegistrationPreflight(mockSupabase, {
      userId: 'user-123',
      eventId: 'event-123',
    })

    expect(result).toEqual({
      ok: false,
      reason: 'missing_profile',
      error: 'Complete onboarding before registering for this event.',
      onboardingPath: '/onboarding?next=%2Fevents%2Fevent-123',
    })
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
  })

  it('routes to onboarding when the public user row cannot be loaded', async () => {
    const { mockSupabase, tableMocks } = buildMockSupabase()

    tableMocks.user.maybeSingle?.mockResolvedValue({
      data: null,
      error: { message: 'No rows found' },
    })

    const result = await getEventRegistrationPreflight(mockSupabase, {
      userId: 'user-123',
      eventId: 'event-123',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('missing_profile')
    }
    expect(tableMocks.person_profile.single).not.toHaveBeenCalled()
    expect(mockSupabase.from).not.toHaveBeenCalledWith('chapter_membership')
  })

  it('builds the onboarding return path for the event detail page', () => {
    expect(getEventOnboardingPath('event-123')).toBe('/onboarding?next=%2Fevents%2Fevent-123')
  })
})
