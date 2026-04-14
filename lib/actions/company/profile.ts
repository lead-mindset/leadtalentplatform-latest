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
    updatedAt: string
  } = {
    updatedAt: new Date().toISOString()
  }

  if (parsed.data.name) userUpdates.name = parsed.data.name
  if (parsed.data.phone !== undefined) userUpdates.phone = parsed.data.phone

  const { error: userError } = await supabase
    .from('User')
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
    companyId: string
    isActive: boolean
    acceptedAt: string | null
    Company: { id: string; name: string; createdat: string; createdbyid: string }[]
  }

  const { data: recruiterAccess, error: accessError } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      companyId,
      isActive,
      acceptedAt,
      Company!inner (id, name, createdat, createdbyid)
    `)
    .eq('acceptedByUserId', user.id)
    .eq('isActive', true)
    .is('revokedAt', null)
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
        accessId: recruiterAccess.id,
        acceptedAt: recruiterAccess.acceptedAt,
      } : null
    },
  }
}

export async function getRecruiterCompanies() {
  const { supabase, user } = await requireRecruiter()

  type AccessWithCompany = {
    id: string
    companyId: string
    isActive: boolean
    acceptedAt: string | null
    grantedAt: string
    revokedAt: string | null
    Company: { id: string; name: string; createdat: string; createdbyid: string }[]
  }

  const { data: allAccess, error } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      companyId,
      isActive,
      acceptedAt,
      grantedAt,
      revokedAt,
      Company!inner (id, name, createdat, createdbyid)
    `)
    .eq('acceptedByUserId', user.id)
    .order('acceptedAt', { ascending: false })

  if (error) {
    return { success: false, error: 'Failed to fetch companies' }
  }

  const companies = (allAccess as AccessWithCompany[]).map(access => ({
    accessId: access.id,
    companyId: access.companyId,
    companyName: access.Company[0]?.name ?? 'Unknown',
    isActive: access.isActive,
    acceptedAt: access.acceptedAt,
    grantedAt: access.grantedAt,
    revokedAt: access.revokedAt,
    company: access.Company[0] ?? null
  }))

  return {
    success: true,
    data: {
      activeCompany: companies.find(c => c.isActive && !c.revokedAt) ?? null,
      allCompanies: companies
    }
  }
}
