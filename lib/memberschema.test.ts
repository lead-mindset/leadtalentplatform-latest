import { describe, expect, it } from 'vitest'
import {
  createProfileUpdateSchema,
  createBasicPersonProfileSchema,
  normalizeOptionalUrl,
} from './memberschema'

const t = (key: string) => key

const validProfileData = {
  full_name: 'Test Participant',
  phone: '+1 555 123 4567',
  gender: 'woman',
  career: 'Product Design',
  graduation_year: 2028,
  skills: ['Leadership', 'Research'],
  linkedin_url: 'https://linkedin.com/in/test-participant',
  consentRecruiterVisibility: true,
  emailNotificationsEnabled: true,
}

describe('member schema URL helpers', () => {
  it('normalizes optional URLs with a missing scheme', () => {
    expect(normalizeOptionalUrl('github.com/lead/example')).toBe(
      'https://github.com/lead/example'
    )
  })

  it('returns null for empty optional URLs', () => {
    expect(normalizeOptionalUrl('   ')).toBeNull()
    expect(normalizeOptionalUrl(undefined)).toBeNull()
  })

  it('validates and normalizes portfolio URL in the basic person profile schema', () => {
    const parsed = createBasicPersonProfileSchema(t).safeParse({
      ...validProfileData,
      portfolio_url: 'portfolio.example.com/work',
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.portfolio_url).toBe('https://portfolio.example.com/work')
  })

  it('rejects invalid portfolio URLs in the basic person profile schema', () => {
    const parsed = createBasicPersonProfileSchema(t).safeParse({
      ...validProfileData,
      portfolio_url: 'not a url',
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['portfolio_url'],
          message: 'validation.invalidUrl',
        }),
      ])
    )
  })

  it('rejects non-http portfolio URL schemes', () => {
    const parsed = createBasicPersonProfileSchema(t).safeParse({
      ...validProfileData,
      portfolio_url: 'ftp://portfolio.example.com/work',
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['portfolio_url'],
          message: 'validation.invalidUrl',
        }),
      ])
    )
  })

  it('allows clearing portfolio URL in the profile update schema', () => {
    const parsed = createProfileUpdateSchema(t).safeParse({
      ...validProfileData,
      lead_chapter: 'leaduni',
      portfolio_url: '',
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.portfolio_url).toBeNull()
  })

  it('rejects invalid portfolio URLs in the profile update schema', () => {
    const parsed = createProfileUpdateSchema(t).safeParse({
      ...validProfileData,
      lead_chapter: 'leaduni',
      portfolio_url: 'not a url',
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['portfolio_url'],
          message: 'validation.invalidUrl',
        }),
      ])
    )
  })
})
