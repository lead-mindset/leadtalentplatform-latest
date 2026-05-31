import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n/routing', () => ({
  routing: { defaultLocale: 'es' },
}))

describe('Supabase proxy route visibility', () => {
  it('allows signed-out recipients to view chapter invite acceptance links', async () => {
    const { isPublicRoute } = await import('./proxy')
    expect(isPublicRoute('/es/chapter/invites/accept')).toBe(true)
    expect(isPublicRoute('/en/chapter/invites/accept')).toBe(true)
  })

  it('keeps other chapter routes protected', async () => {
    const { isPublicRoute } = await import('./proxy')
    expect(isPublicRoute('/es/chapter')).toBe(false)
    expect(isPublicRoute('/en/chapter/members')).toBe(false)
  })
})
