'use server'

import { requireRecruiter } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { CompanyService } from '@/lib/services/company.service'

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).optional(),
})

type ProfileActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

export async function updateProfile(formData: {
  name?: string
  phone?: string
}): Promise<ProfileActionResult> {
  const parsed = updateProfileSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: 'Enter a valid name and phone number.' }
  }

  const { supabase, user } = await requireRecruiter()

  const result = await CompanyService.updateProfile(supabase, user.id, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  })

  if (result.success) {
    revalidatePath('/company/profile')
    revalidatePath('/company')
  }

  return result
}

export async function getRecruiterProfile() {
  const { supabase, user } = await requireRecruiter()

  const result = await CompanyService.getRecruiterProfile(supabase, user.id)

  if (!result.success) {
    return { success: false as const, error: result.error }
  }

  return {
    success: true as const,
    data: {
      user,
      company: result.data.company,
      accessInfo: result.data.accessInfo,
    },
  }
}

export async function getRecruiterCompanies() {
  const { supabase, user } = await requireRecruiter()

  return CompanyService.getRecruiterCompanies(supabase, user.id)
}
