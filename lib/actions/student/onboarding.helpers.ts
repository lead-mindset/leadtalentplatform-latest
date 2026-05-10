import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import { createBasicOnboardingSchema } from '@/lib/memberschema'
import type { Database } from '@/lib/database.generated'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { ChapterMembershipService } from '@/lib/services/chapter-membership.service'
import { NewsletterSubscriptionService } from '@/lib/services/newsletter-subscription.service'

type BasicOnboardingData = z.infer<ReturnType<typeof createBasicOnboardingSchema>>
type ActionResult =
  | { success: true }
  | { success: false; error: string; details?: unknown }

function parseJsonStringArray(rawValue: FormDataEntryValue | null): string[] {
  if (typeof rawValue !== 'string' || !rawValue.trim()) return []

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key)
  return value === 'true' || value === 'on' || value === '1'
}

export function parseBasicOnboardingFormData(
  formData: FormData,
  t: Parameters<typeof createBasicOnboardingSchema>[0]
) {
  return createBasicOnboardingSchema(t).safeParse({
    full_name: formData.get('full_name')?.toString() ?? '',
    phone: formData.get('phone')?.toString() ?? '',
    university: formData.get('university')?.toString() ?? '',
    career: formData.get('career')?.toString() ?? '',
    gender: formData.get('gender')?.toString() ?? '',
    graduation_year: Number(formData.get('graduation_year')) || 0,
    skills: parseJsonStringArray(formData.get('skills')),
    linkedin_url: formData.get('linkedin_url')?.toString() ?? '',
    portfolio_url: formData.get('portfolio_url')?.toString() ?? '',
    chapterIntent: formData.get('chapterIntent')?.toString() ?? '',
    selectedChapterId: formData.get('selectedChapterId')?.toString() ?? '',
    chapterNewsletterIds: parseJsonStringArray(formData.get('chapterNewsletterIds')),
    consentRecruiterVisibility: readBoolean(formData, 'consentRecruiterVisibility'),
    emailNotificationsEnabled: readBoolean(formData, 'emailNotificationsEnabled'),
    termsAccepted: readBoolean(formData, 'termsAccepted'),
  })
}

export async function saveBasicOnboarding(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    email: string
    data: BasicOnboardingData
  }
): Promise<ActionResult> {
  const profileResult = await PersonProfileService.upsertBasicProfile(supabase, {
    userId: params.userId,
    email: params.email,
    fullName: params.data.full_name,
    phone: params.data.phone,
    university: params.data.university || null,
    majorOrInterest: params.data.career,
    graduationYear: params.data.graduation_year,
    linkedinUrl: params.data.linkedin_url,
    portfolioUrl: params.data.portfolio_url ?? null,
    skills: params.data.skills,
    gender: params.data.gender,
    isRecruiterVisible: params.data.consentRecruiterVisibility,
  })

  if (!profileResult.success) return profileResult

  const shouldApplyToChapter =
    params.data.chapterIntent === 'already_member' || params.data.chapterIntent === 'apply_to_chapter'

  if (shouldApplyToChapter) {
    const membershipResult = await ChapterMembershipService.applyToChapter(supabase, {
      userId: params.userId,
      chapterId: params.data.selectedChapterId,
      position: 'member',
    })

    if (!membershipResult.success) return membershipResult
  }

  if (params.data.emailNotificationsEnabled) {
    const globalResult = await NewsletterSubscriptionService.subscribeGlobal(supabase, {
      userId: params.userId,
      source: 'onboarding',
    })

    if (!globalResult.success) return globalResult
  }

  if (params.data.chapterNewsletterIds.length > 0) {
    const chapterResult = await NewsletterSubscriptionService.subscribeToChapters(supabase, {
      userId: params.userId,
      chapterIds: params.data.chapterNewsletterIds,
      source: 'onboarding',
    })

    if (!chapterResult.success) return chapterResult
  }

  return { success: true }
}
