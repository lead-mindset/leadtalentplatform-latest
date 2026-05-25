import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePostAuthRedirectPath } from '@/lib/auth-redirects'
import { AuthRedirectService } from '../auth-redirect.service'

vi.mock('@/lib/auth-redirects', () => ({
  resolvePostAuthRedirectPath: vi.fn(),
}))

function buildTableQuery(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }

  return query
}

function buildSupabase({
  authUser = { id: 'user-1' },
  authError = null,
  userData = { role: 'member' },
  userError = null,
  profileData = { user_id: 'user-1' },
  profileError = null,
}: {
  authUser?: { id: string } | null
  authError?: unknown
  userData?: unknown
  userError?: unknown
  profileData?: unknown
  profileError?: unknown
} = {}) {
  const userQuery = buildTableQuery(userData, userError)
  const profileQuery = buildTableQuery(profileData, profileError)
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authError,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'user') return userQuery
      if (table === 'person_profile') return profileQuery
      throw new Error(`Unexpected table ${table}`)
    }),
  }

  return { supabase }
}

describe('AuthRedirectService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves the dashboard from server-trusted account facts', async () => {
    const { supabase } = buildSupabase()
    vi.mocked(resolvePostAuthRedirectPath).mockResolvedValue('/chapter')

    const result = await AuthRedirectService.resolvePostLoginRedirect(supabase as never)

    expect(result).toEqual({ success: true, path: '/chapter' })
    expect(resolvePostAuthRedirectPath).toHaveBeenCalledWith(supabase, {
      userId: 'user-1',
      hasProfile: true,
      role: 'member',
    })
  })

  it('returns a visible error when the authenticated session is missing', async () => {
    const { supabase } = buildSupabase({ authUser: null })

    const result = await AuthRedirectService.resolvePostLoginRedirect(supabase as never)

    expect(result).toEqual({
      success: false,
      error: 'We could not load your account destination. Please try signing in again.',
      path: '/auth/login',
    })
    expect(supabase.from).not.toHaveBeenCalled()
    expect(resolvePostAuthRedirectPath).not.toHaveBeenCalled()
  })

  it('does not guess a redirect when account lookup fails', async () => {
    const { supabase } = buildSupabase({
      userData: null,
      userError: new Error('db unavailable'),
    })

    const result = await AuthRedirectService.resolvePostLoginRedirect(supabase as never)

    expect(result).toEqual({
      success: false,
      error: 'We could not load your account destination. Please try signing in again.',
    })
    expect(resolvePostAuthRedirectPath).not.toHaveBeenCalled()
  })
})
