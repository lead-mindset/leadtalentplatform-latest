import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/i18n/routing', () => ({
  routing: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
}))

vi.mock('@/lib/app-url', () => ({
  getConfiguredAppUrl: () => 'https://example.com',
}))

describe('auth callback redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves the recruiter invite next path after OTP verification', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', user_metadata: {} } },
          error: null,
        }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const request = new Request(
      'https://example.com/en/auth/callback?code=auth-code&next=%2Frecruiter%2Faccess%3Ftoken%3Dinvite-token'
    )

    const response = await GET(request, { params: { locale: 'en' } } as never)

    expect(response.headers.get('location')).toBe(
      'https://example.com/en/recruiter/access?token=invite-token'
    )
  })
})
