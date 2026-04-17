'use server'

import { requireRecruiter } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

  const userUpdates: {
    name?: string
    phone?: string
    updated_at: string
  } = {
    updated_at: new Date().toISOString()
  }

  if (parsed.data.name) userUpdates.name = parsed.data.name
  if (parsed.data.phone !== undefined) userUpdates.phone = parsed.data.phone

  const { error: userError } = await supabase
    .from('user')
    .update(userUpdates)
    .eq('id', user.id)

  if (userError) {
    return { success: false, error: 'Failed to update profile information' }
  }

  revalidatePath('/company/profile')
  revalidatePath('/company')

  return { success: true, message: 'Profile updated successfully' }
}

export async function getRecruiterProfile() {
  const { supabase, user } = await requireRecruiter()

  type RecruiterAccessWithCompany = {
    id: string
    company_id: string
    is_active: boolean
    accepted_at: string | null
    Company: { id: string; name: string; created_at: string; created_by_id: string }[]
  }

  const { data: recruiterAccess, error: accessError } = await supabase
    .from('recruiter_access')
    .select(`
      id,
      company_id,
      is_active,
      accepted_at,
      Company!inner (id, name, created_at, created_by_id)
    `)
    .eq('accepted_by_user_id', user.id)
    .eq('is_active', true)
    .is('revoked_at', null)
    .maybeSingle<RecruiterAccessWithCompany>()

  if (accessError) {
    return { success: false, error: 'Failed to load recruiter access.' }
  }

  const company = recruiterAccess?.Company?.[0] ?? null

  return {
    success: true,
    data: {
      user,
      company,
accessInfo: recruiterAccess ? {
         access_id: recruiterAccess.id,
         accepted_at: recruiterAccess.accepted_at,
       } : null
    },
  }
}

export async function getRecruiterCompanies() {
  const { supabase, user } = await requireRecruiter()

  type AccessWithCompany = {
    id: string
    company_id: string
    is_active: boolean
    accepted_at: string | null
    granted_at: string
    revoked_at: string | null
    Company: { id: string; name: string; created_at: string; created_by_id: string }[]
  }

  const { data: allAccess, error } = await supabase
    .from('recruiter_access')
    .select(`
      id,
      company_id,
      is_active,
      accepted_at,
      granted_at,
      revoked_at,
      Company!inner (id, name, created_at, created_by_id)
    `)
    .eq('accepted_by_user_id', user.id)
    .order('accepted_at', { ascending: false })

  if (error) {
    return { success: false, error: 'Failed to fetch companies' }
  }

  const companies = (allAccess as unknown as AccessWithCompany[]).map(access => ({
    accessId: access.id,
    companyId: access.company_id,
    companyName: access.Company[0]?.name ?? 'Unknown',
    isActive: access.is_active,
    accepted_at: access.accepted_at,
    granted_at: access.granted_at,
    revoked_at: access.revoked_at,
    company: access.Company[0] ?? null
  }))

  return {
    success: true,
    data: {
      activeCompany: companies.find(c => c.isActive && !c.revoked_at) ?? null,
      allCompanies: companies
    }
  }
}
