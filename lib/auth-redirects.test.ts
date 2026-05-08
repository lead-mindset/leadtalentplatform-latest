import { describe, expect, it } from 'vitest'
import { getPostAuthRedirectPath } from './auth-redirects'

describe('getPostAuthRedirectPath', () => {
  it('sends member and editor users with profiles to the student dashboard', () => {
    expect(getPostAuthRedirectPath({ role: 'member', hasProfile: true })).toBe('/student')
    expect(getPostAuthRedirectPath({ role: 'editor', hasProfile: true })).toBe('/student')
  })

  it('sends member and editor users without profiles to onboarding', () => {
    expect(getPostAuthRedirectPath({ role: 'member', hasProfile: false })).toBe('/onboarding')
    expect(getPostAuthRedirectPath({ role: 'editor', hasProfile: false })).toBe('/onboarding')
  })

  it('sends workspace roles to their role-specific dashboard', () => {
    expect(getPostAuthRedirectPath({ role: 'admin', hasProfile: false })).toBe('/admin')
    expect(getPostAuthRedirectPath({ role: 'recruiter', hasProfile: false })).toBe('/company')
  })

  it('falls back safely for missing or unknown roles', () => {
    expect(getPostAuthRedirectPath({ role: null, hasProfile: false })).toBe('/onboarding')
    expect(getPostAuthRedirectPath({ role: 'unknown' as never, hasProfile: true })).toBe('/auth/error')
  })
})
