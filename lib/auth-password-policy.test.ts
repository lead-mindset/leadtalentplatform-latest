import { describe, expect, it } from 'vitest'
import { getPasswordPolicyMessage, isStrongPassword } from './auth-password-policy'

describe('auth password policy', () => {
  it('requires length, letter, number, and symbol', () => {
    expect(isStrongPassword('Password1!')).toBe(true)
    expect(isStrongPassword('Pass1!')).toBe(false)
    expect(isStrongPassword('Password!')).toBe(false)
    expect(isStrongPassword('Password1')).toBe(false)
    expect(isStrongPassword('12345678!')).toBe(false)
  })

  it('returns Spanish-first launch copy by default', () => {
    expect(getPasswordPolicyMessage()).toBe('Usa al menos 8 caracteres con una letra, un numero y un simbolo.')
    expect(getPasswordPolicyMessage('en')).toBe('Use at least 8 characters with one letter, one number, and one symbol.')
  })
})
