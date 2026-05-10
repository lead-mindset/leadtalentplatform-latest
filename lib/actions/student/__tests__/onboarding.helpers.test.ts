import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  parseBasicOnboardingFormData,
  saveBasicOnboarding,
} from '@/lib/actions/student/onboarding.helpers'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { NewsletterSubscriptionService } from '@/lib/services/newsletter-subscription.service'
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service'
import { ChapterService } from '@/lib/services/chapter.service'
import {
  sendChapterApplicationSubmittedEmail,
  sendWelcomeEmail,
} from '@/lib/emails/send-email'

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

vi.mock('@/lib/services/chapter-membership.service', () => ({
  ChapterMembershipService: {
    applyToChapter: vi.fn(),
  },
}))

vi.mock('@/lib/services/chapter.service', () => ({
  ChapterService: {
    getChapterName: vi.fn(),
  },
}))

vi.mock('@/lib/emails/send-email', () => ({
  sendChapterApplicationSubmittedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
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
    vi.mocked(ChapterMembershipService.applyToChapter).mockReset()
    vi.mocked(ChapterService.getChapterName).mockReset()
    vi.mocked(sendChapterApplicationSubmittedEmail).mockReset()
    vi.mocked(sendWelcomeEmail).mockReset()
    vi.mocked(ChapterService.getChapterName).mockResolvedValue('LEAD UNI')
    vi.mocked(sendChapterApplicationSubmittedEmail).mockResolvedValue({ success: true })
    vi.mocked(sendWelcomeEmail).mockResolvedValue({ success: true })
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

  it('normalizes portfolio URLs that omit the https scheme', () => {
    const formData = validFormData()
    formData.set('portfolio_url', 'github.com/lead/example')

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.portfolio_url).toBe('https://github.com/lead/example')
  })

  it('preserves portfolio URLs that already include https', () => {
    const formData = validFormData()
    formData.set('portfolio_url', 'https://portfolio.example.com/work')

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.portfolio_url).toBe('https://portfolio.example.com/work')
  })

  it('treats an empty portfolio URL as null', () => {
    const formData = validFormData()
    formData.set('portfolio_url', '   ')

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.portfolio_url).toBeNull()
  })

  it('rejects invalid portfolio URLs after normalization', () => {
    const formData = validFormData()
    formData.set('portfolio_url', 'not a url')

    const parsed = parseBasicOnboardingFormData(formData, t)

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
    expect(ChapterMembershipService.applyToChapter).not.toHaveBeenCalled()
    expect(sendWelcomeEmail).toHaveBeenCalledWith('participant@test.com', 'Test Participant')
  })

  it('creates a pending membership application for an existing chapter member claim', async () => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockResolvedValue({ success: true })
    vi.mocked(ChapterMembershipService.applyToChapter).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeGlobal).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeToChapters).mockResolvedValue({ success: true })

    const formData = validFormData()
    formData.set('chapterIntent', 'already_member')
    formData.set('selectedChapterId', 'leaduni')

    const parsed = parseBasicOnboardingFormData(formData, t)
    if (!parsed.success) throw new Error('Expected valid onboarding data')

    const result = await saveBasicOnboarding({} as SupabaseClient<Database>, {
      userId: 'user-123',
      email: 'participant@test.com',
      data: parsed.data,
    })

    expect(result).toEqual({ success: true })
    expect(ChapterMembershipService.applyToChapter).toHaveBeenCalledWith(
      {},
      {
        userId: 'user-123',
        chapterId: 'leaduni',
        position: 'member',
      }
    )
    expect(sendChapterApplicationSubmittedEmail).toHaveBeenCalledWith(
      'participant@test.com',
      'Test Participant',
      'LEAD UNI'
    )
  })

  it('creates a pending membership application for chapter applicants', async () => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockResolvedValue({ success: true })
    vi.mocked(ChapterMembershipService.applyToChapter).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeGlobal).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeToChapters).mockResolvedValue({ success: true })

    const formData = validFormData()
    formData.set('chapterIntent', 'apply_to_chapter')
    formData.set('selectedChapterId', 'leadutec')

    const parsed = parseBasicOnboardingFormData(formData, t)
    if (!parsed.success) throw new Error('Expected valid onboarding data')

    const result = await saveBasicOnboarding({} as SupabaseClient<Database>, {
      userId: 'user-123',
      email: 'participant@test.com',
      data: parsed.data,
    })

    expect(result).toEqual({ success: true })
    expect(ChapterMembershipService.applyToChapter).toHaveBeenCalledWith(
      {},
      {
        userId: 'user-123',
        chapterId: 'leadutec',
        position: 'member',
      }
    )
    expect(sendChapterApplicationSubmittedEmail).toHaveBeenCalledWith(
      'participant@test.com',
      'Test Participant',
      'LEAD UNI'
    )
  })

  it('returns membership application failure and skips newsletter writes', async () => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockResolvedValue({ success: true })
    vi.mocked(ChapterMembershipService.applyToChapter).mockResolvedValue({
      success: false,
      error: 'User already has an active approved chapter membership.',
    })

    const formData = validFormData()
    formData.set('chapterIntent', 'already_member')
    formData.set('selectedChapterId', 'leaduni')

    const parsed = parseBasicOnboardingFormData(formData, t)
    if (!parsed.success) throw new Error('Expected valid onboarding data')

    const result = await saveBasicOnboarding({} as SupabaseClient<Database>, {
      userId: 'user-123',
      email: 'participant@test.com',
      data: parsed.data,
    })

    expect(result).toEqual({
      success: false,
      error: 'User already has an active approved chapter membership.',
    })
    expect(NewsletterSubscriptionService.subscribeGlobal).not.toHaveBeenCalled()
    expect(NewsletterSubscriptionService.subscribeToChapters).not.toHaveBeenCalled()
    expect(sendChapterApplicationSubmittedEmail).not.toHaveBeenCalled()
    expect(sendWelcomeEmail).not.toHaveBeenCalled()
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
    expect(ChapterMembershipService.applyToChapter).not.toHaveBeenCalled()
    expect(NewsletterSubscriptionService.subscribeGlobal).not.toHaveBeenCalled()
    expect(NewsletterSubscriptionService.subscribeToChapters).not.toHaveBeenCalled()
  })
})
