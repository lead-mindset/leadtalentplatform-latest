import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  parseBasicOnboardingFormData,
  saveBasicOnboarding,
} from '@/lib/actions/student/onboarding.helpers'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { NewsletterSubscriptionService } from '@/lib/services/newsletter-subscription.service'

vi.mock('@/lib/services/person-profile.service', () => ({
  PersonProfileService: {
    upsertBasicProfile: vi.fn(),
  },
}))

vi.mock('@/lib/services/newsletter-subscription.service', () => ({
  NewsletterSubscriptionService: {
    subscribeGlobal: vi.fn(),
    subscribeToChapters: vi.fn(),
  },
}))

const t = (key: string) => key

function validFormData() {
  const formData = new FormData()
  formData.set('full_name', 'Test Participant')
  formData.set('phone', '+1 555 123 4567')
  formData.set('university', 'Universidad Nacional')
  formData.set('career', 'Product Design')
  formData.set('gender', 'woman')
  formData.set('graduation_year', '2028')
  formData.set('skills', JSON.stringify(['Leadership', 'Research']))
  formData.set('linkedin_url', 'https://linkedin.com/in/test-participant')
  formData.set('portfolio_url', 'https://example.com')
  formData.set('chapterIntent', 'events_only')
  formData.set('selectedChapterId', '')
  formData.set('chapterNewsletterIds', JSON.stringify(['leaduni', 'leadutec']))
  formData.set('consentRecruiterVisibility', 'true')
  formData.set('emailNotificationsEnabled', 'true')
  formData.set('termsAccepted', 'true')
  return formData
}

describe('basic onboarding helpers', () => {
  beforeEach(() => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockReset()
    vi.mocked(NewsletterSubscriptionService.subscribeGlobal).mockReset()
    vi.mocked(NewsletterSubscriptionService.subscribeToChapters).mockReset()
  })

  it('parses reusable profile and newsletter data without requiring chapter membership fields', () => {
    const parsed = parseBasicOnboardingFormData(validFormData(), t)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data).toMatchObject({
      full_name: 'Test Participant',
      career: 'Product Design',
      chapterIntent: 'events_only',
      selectedChapterId: '',
      chapterNewsletterIds: ['leaduni', 'leadutec'],
      consentRecruiterVisibility: true,
      emailNotificationsEnabled: true,
    })
  })

  it('accepts chapter-related intent when a valid chapter is selected', () => {
    const formData = validFormData()
    formData.set('chapterIntent', 'already_member')
    formData.set('selectedChapterId', 'leaduni')

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data).toMatchObject({
      chapterIntent: 'already_member',
      selectedChapterId: 'leaduni',
    })
  })

  it('requires a chapter for chapter-related intent', () => {
    const formData = validFormData()
    formData.set('chapterIntent', 'apply_to_chapter')
    formData.set('selectedChapterId', '')

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['selectedChapterId'],
          message: 'validation.selectYourChapter',
        }),
      ])
    )
  })

  it('allows events-only onboarding without a chapter selection', () => {
    const formData = validFormData()
    formData.set('chapterIntent', 'events_only')
    formData.set('selectedChapterId', '')
    formData.set('chapterNewsletterIds', JSON.stringify([]))

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.selectedChapterId).toBe('')
  })

  it('saves person_profile data and optional newsletter subscriptions', async () => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeGlobal).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeToChapters).mockResolvedValue({ success: true })

    const parsed = parseBasicOnboardingFormData(validFormData(), t)
    if (!parsed.success) throw new Error('Expected valid onboarding data')

    const result = await saveBasicOnboarding({} as SupabaseClient<Database>, {
      userId: 'user-123',
      email: 'participant@test.com',
      data: parsed.data,
    })

    expect(result).toEqual({ success: true })
    expect(PersonProfileService.upsertBasicProfile).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        userId: 'user-123',
        email: 'participant@test.com',
        fullName: 'Test Participant',
        majorOrInterest: 'Product Design',
        isRecruiterVisible: true,
      })
    )
    expect(NewsletterSubscriptionService.subscribeGlobal).toHaveBeenCalledWith(
      {},
      { userId: 'user-123', source: 'onboarding' }
    )
    expect(NewsletterSubscriptionService.subscribeToChapters).toHaveBeenCalledWith(
      {},
      {
        userId: 'user-123',
        chapterIds: ['leaduni', 'leadutec'],
        source: 'onboarding',
      }
    )
  })

  it('skips newsletter writes when no newsletter choices are selected', async () => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockResolvedValue({ success: true })
    const formData = validFormData()
    formData.set('emailNotificationsEnabled', 'false')
    formData.set('chapterNewsletterIds', JSON.stringify([]))

    const parsed = parseBasicOnboardingFormData(formData, t)
    if (!parsed.success) throw new Error('Expected valid onboarding data')

    const result = await saveBasicOnboarding({} as SupabaseClient<Database>, {
      userId: 'user-123',
      email: 'participant@test.com',
      data: parsed.data,
    })

    expect(result).toEqual({ success: true })
    expect(NewsletterSubscriptionService.subscribeGlobal).not.toHaveBeenCalled()
    expect(NewsletterSubscriptionService.subscribeToChapters).not.toHaveBeenCalled()
  })
})
