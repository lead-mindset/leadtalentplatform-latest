import { describe, expect, it } from 'vitest'
import { getAuthEmailValidationMessage, isValidAuthEmail } from './auth-form-validation'

describe('auth form validation', () => {
  it('validates basic email shape for app-controlled auth forms', () => {
    expect(isValidAuthEmail('person@example.com')).toBe(true)
    expect(isValidAuthEmail(' person@example.com ')).toBe(true)
    expect(isValidAuthEmail('person')).toBe(false)
    expect(isValidAuthEmail('person@example')).toBe(false)
    expect(isValidAuthEmail('person@')).toBe(false)
  })

  it('returns Spanish-first validation copy by default', () => {
    expect(getAuthEmailValidationMessage()).toBe('Ingresa un correo electronico valido.')
    expect(getAuthEmailValidationMessage('en')).toBe('Enter a valid email address.')
  })
})
