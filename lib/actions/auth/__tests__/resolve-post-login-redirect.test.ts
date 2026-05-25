import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePostLoginRedirect } from '../resolve-post-login-redirect'
import { createClient } from '@/lib/supabase/server'
import { AuthRedirectService } from '@/lib/services/auth-redirect.service'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/auth-redirect.service', () => ({
  AuthRedirectService: {
    resolvePostLoginRedirect: vi.fn(),
  },
}))

describe('resolvePostLoginRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the server action thin and delegates redirect resolution to the service', async () => {
    const supabase = { auth: {} }
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.mocked(AuthRedirectService.resolvePostLoginRedirect).mockResolvedValue({
      success: true,
      path: '/chapter',
    })

    const result = await resolvePostLoginRedirect()

    expect(result).toEqual({ success: true, path: '/chapter' })
    expect(createClient).toHaveBeenCalled()
    expect(AuthRedirectService.resolvePostLoginRedirect).toHaveBeenCalledWith(supabase)
  })
})
