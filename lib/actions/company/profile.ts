'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: {
  name?: string
  phone?: string
}) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: user } = await supabase
    .from('User')
    .select('id, role')
    .eq('id', authUser.id)
    .single()

  if (!user || user.role !== 'recruiter') {
    return { success: false, error: 'Unauthorized - recruiters only' }
  }

  const userUpdates: {
    name?: string
    phone?: string
    updatedAt: string
  } = {
    updatedAt: new Date().toISOString()
  }

  if (formData.name) userUpdates.name = formData.name
  if (formData.phone !== undefined) userUpdates.phone = formData.phone

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
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: user, error: userError } = await supabase
    .from('User')
    .select('id, email, name, role, phone, createdAt, updatedAt, deactivatedAt')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    return { success: false, error: 'User not found' }
  }

  if (user.role !== 'recruiter') {
    return { success: false, error: 'Unauthorized' }
  }

  type RecruiterAccessWithCompany = {
    id: string
    companyId: string
    isActive: boolean
    acceptedAt: string | null
    Company: { id: string; name: string; createdat: string; createdbyid: string }[]
  }

  const { data: recruiterAccess } = await supabase
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
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: user } = await supabase
    .from('User')
    .select('id, role')
    .eq('id', authUser.id)
    .single()

  if (!user || user.role !== 'recruiter') {
    return { success: false, error: 'Unauthorized' }
  }

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