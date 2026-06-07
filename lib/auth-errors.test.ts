import { describe, expect, it } from 'vitest'
import { getAuthErrorKey } from './auth-errors'

describe('auth error mapping', () => {
  it('maps known Supabase auth errors to translation keys', () => {
    expect(getAuthErrorKey(new Error('Invalid login credentials'))).toBe('invalidCredentials')
    expect(getAuthErrorKey(new Error('Email not confirmed'))).toBe('emailNotConfirmed')
  })

  it('maps browser fetch failures to network error copy', () => {
    expect(getAuthErrorKey(new TypeError('Failed to fetch'))).toBe('networkError')
    expect(getAuthErrorKey(new Error('Network request failed'))).toBe('networkError')
  })

  it('falls back to a generic auth error key', () => {
    expect(getAuthErrorKey(new Error('Unexpected provider response'))).toBe('anErrorOccurred')
  })
})
