'use server'

import { requireUser } from '@/lib/auth'
import { createBasicPersonProfileSchema } from '@/lib/memberschema'
import { PersonProfileService } from '@/lib/services/person-profile.service'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

type PersonProfileActionResult =
  | { success: true; message?: string }
  | { success: false; error: string; details?: unknown }

function parseSkills(rawValue: FormDataEntryValue | null): string[] {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed)
      ? parsed.filter((skill): skill is string => typeof skill === 'string')
      : []
  } catch {
    return []
  }
}

export async function getBasicPersonProfile() {
  const { supabase, user } = await requireUser()
  return PersonProfileService.getBasicProfile(supabase, user.id)
}

export async function upsertBasicPersonProfile(
  formData: FormData
): Promise<PersonProfileActionResult> {
  const { supabase, user } = await requireUser()
  const t = await getTranslations()
  const schema = createBasicPersonProfileSchema(t)

  const rawData = {
    full_name: formData.get('full_name')?.toString() || '',
    phone: formData.get('phone')?.toString() || '',
    gender: formData.get('gender')?.toString() || undefined,
    career: formData.get('career')?.toString() || '',
    graduation_year: Number(formData.get('graduation_year') ?? 0),
    skills: parseSkills(formData.get('skills')),
    linkedin_url: formData.get('linkedin_url')?.toString() || '',
    consentRecruiterVisibility: formData.get('consentRecruiterVisibility') === 'true',
    emailNotificationsEnabled: formData.get('emailNotificationsEnabled') === 'true',
  }

  const parsed = schema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error }
  }

  const data = parsed.data
  const result = await PersonProfileService.upsertBasicProfile(supabase, {
    userId: user.id,
    email: user.email,
    fullName: data.full_name,
    phone: data.phone,
    university: formData.get('university')?.toString() || null,
    majorOrInterest: data.career,
    graduationYear: data.graduation_year,
    linkedinUrl: data.linkedin_url,
    portfolioUrl: formData.get('portfolio_url')?.toString() || null,
    skills: data.skills,
    gender: data.gender,
    isRecruiterVisible: data.consentRecruiterVisibility,
  })

  if (!result.success) return result

  revalidatePath('/student/profile')
  revalidatePath('/onboarding')

  return { success: true, message: 'Profile updated successfully' }
}
