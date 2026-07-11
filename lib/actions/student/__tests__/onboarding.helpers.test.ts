import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'
import {
  parseBasicOnboardingFormData,
  saveBasicOnboarding,
} from '@/lib/actions/student/onboarding.helpers'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { StudentService } from '@/lib/services/student.service'
import { NewsletterSubscriptionService } from '@/lib/services/newsletter-subscription.service'
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service'
import { ChapterInviteService } from '@/lib/services/chapter-invite.service'
import { ChapterPreapprovalService } from '@/lib/services/chapter-preapproval.service'

vi.mock('@/lib/services/person-profile.service', () => ({
  PersonProfileService: {
    upsertBasicProfile: vi.fn(),
  },
}))

vi.mock('@/lib/services/student.service', () => ({
  StudentService: {
    saveResume: vi.fn(),
  },
}))

vi.mock('@/lib/services/student.service', () => ({
  StudentService: {
    saveResume: vi.fn(),
  },
}))

vi.mock('@/lib/services/newsletter-subscription.service', () => ({
  NewsletterSubscriptionService: {
    subscribeGlobal: vi.fn(),
    subscribeToChapters: vi.fn(),
  },
}))

vi.mock('@/lib/services/chapter-invite.service', () => ({
  ChapterInviteService: {
    findPendingInviteForEmail: vi.fn(),
  },
}))

vi.mock('@/lib/services/chapter-membership.service', () => ({
  ChapterMembershipService: {
    applyToChapter: vi.fn(),
  },
}))

vi.mock('@/lib/services/chapter-preapproval.service', () => ({
  ChapterPreapprovalService: {
    activatePreapprovalForUser: vi.fn(),
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
    vi.mocked(StudentService.saveResume).mockReset()
    vi.mocked(NewsletterSubscriptionService.subscribeGlobal).mockReset()
    vi.mocked(NewsletterSubscriptionService.subscribeToChapters).mockReset()
    vi.mocked(ChapterMembershipService.applyToChapter).mockReset()
    vi.mocked(ChapterInviteService.findPendingInviteForEmail).mockReset()
    vi.mocked(ChapterInviteService.findPendingInviteForEmail).mockResolvedValue(null)
    vi.mocked(ChapterPreapprovalService.activatePreapprovalForUser).mockReset()
    vi.mocked(ChapterPreapprovalService.activatePreapprovalForUser).mockResolvedValue({
      success: true,
      activated: false,
      reason: 'no_matching_preapproval',
    })
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
      chapterNewsletterIds: [],
      consentRecruiterVisibility: true,
      emailNotificationsEnabled: true,
    })
  })

  it('normalizes phone formatting before saving reusable profile data', () => {
    const formData = validFormData()
    formData.set('phone', ' +51 (999) 999-999 ')

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data.phone).toBe('+51999999999')
  })

  it('rejects phone values that cannot be normalized to a valid profile phone', () => {
    const formData = validFormData()
    formData.set('phone', 'abc-123')

    const parsed = parseBasicOnboardingFormData(formData, t)

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['phone'],
          message: 'validation.phoneInvalid',
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
    expect(ChapterPreapprovalService.activatePreapprovalForUser).toHaveBeenCalledWith(
      {},
      {
        userId: 'user-123',
        email: 'participant@test.com',
      }
    )
    expect(NewsletterSubscriptionService.subscribeGlobal).toHaveBeenCalledWith(
      {},
      { userId: 'user-123', source: 'onboarding' }
    )
    expect(NewsletterSubscriptionService.subscribeToChapters).not.toHaveBeenCalled()
    expect(ChapterMembershipService.applyToChapter).not.toHaveBeenCalled()
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
  })

  it('activates matching preapproval with the service client and skips pending chapter application', async () => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockResolvedValue({ success: true })
    vi.mocked(ChapterPreapprovalService.activatePreapprovalForUser).mockResolvedValue({
      success: true,
      activated: true,
      preapprovalId: 'preapproval-1',
      chapterId: 'leaduni',
      preapprovalType: 'eboard',
      memberId: 'LEAD-123456',
      roleAssignmentId: 'role-1',
      grantedPermissions: ['chapter.dashboard.access'],
    })
    vi.mocked(NewsletterSubscriptionService.subscribeGlobal).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeToChapters).mockResolvedValue({ success: true })

    const formData = validFormData()
    formData.set('chapterIntent', 'already_member')
    formData.set('selectedChapterId', 'leaduni')

    const parsed = parseBasicOnboardingFormData(formData, t)
    if (!parsed.success) throw new Error('Expected valid onboarding data')

    const serviceSupabase = { service: true } as unknown as SupabaseClient<Database>
    const result = await saveBasicOnboarding({} as SupabaseClient<Database>, {
      userId: 'user-123',
      email: 'participant@test.com',
      data: parsed.data,
      preapprovalSupabase: serviceSupabase,
    })

    expect(result).toEqual({ success: true, postOnboardingRedirectPath: '/chapter' })
    expect(ChapterPreapprovalService.activatePreapprovalForUser).toHaveBeenCalledWith(
      serviceSupabase,
      {
        userId: 'user-123',
        email: 'participant@test.com',
      }
    )
    expect(ChapterMembershipService.applyToChapter).not.toHaveBeenCalled()
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

  it('saves resume when resumePdf file is provided', async () => {
    vi.mocked(PersonProfileService.upsertBasicProfile).mockResolvedValue({ success: true })
    vi.mocked(StudentService.saveResume).mockResolvedValue({ success: true })
    vi.mocked(NewsletterSubscriptionService.subscribeGlobal).mockResolvedValue({ success: true })

    const parsed = parseBasicOnboardingFormData(validFormData(), t)
    if (!parsed.success) throw new Error('Expected valid onboarding data')

    const mockFile = new File([''], 'resume.pdf', { type: 'application/pdf' })

    const result = await saveBasicOnboarding({} as SupabaseClient<Database>, {
      userId: 'user-123',
      email: 'participant@test.com',
      data: parsed.data,
      resumePdf: mockFile,
    })

    expect(result).toEqual({ success: true })
    expect(StudentService.saveResume).toHaveBeenCalledWith(
      {},
      'user-123',
      mockFile,
    )
  })
})
