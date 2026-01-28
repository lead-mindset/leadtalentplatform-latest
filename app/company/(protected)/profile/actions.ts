'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: {
  name?: string
  phone?: string
  title?: string
  department?: string
  skills?: string[]
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

  const userUpdates: any = {}
  if (formData.name) userUpdates.name = formData.name

  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from('User')
      .update(userUpdates)
      .eq('id', user.id)

    if (userError) {
      return { success: false, error: 'Failed to update user information' }
    }
  }

  const { data: existingProfile } = await supabase
    .from('RecruiterProfile')
    .select('id')
    .eq('userId', user.id)
    .maybeSingle()

  const profileData = {
    userId: user.id,
    phone: formData.phone,
    title: formData.title,
    department: formData.department,
    skills: formData.skills,
    isFilled: !!(formData.name && formData.phone && formData.title),
    updatedAt: new Date().toISOString(),
  }

  if (existingProfile) {
    const { error: profileError } = await supabase
      .from('RecruiterProfile')
      .update(profileData)
      .eq('userId', user.id)

    if (profileError) {
      return { success: false, error: 'Failed to update profile' }
    }
  } else {
    const { error: profileError } = await supabase
      .from('RecruiterProfile')
      .insert({
        ...profileData,
        createdAt: new Date().toISOString(),
      })

    if (profileError) {
      return { success: false, error: 'Failed to create profile' }
    }
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
    .select('id, email, name, role')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    return { success: false, error: 'User not found' }
  }

  if (user.role !== 'recruiter') {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('RecruiterProfile')
    .select('*')
    .eq('userId', user.id)
    .maybeSingle()

  const { data: recruiterAccess } = await supabase
    .from('RecruiterAccess')
    .select('companyId, Company(name, id)')
    .eq('acceptedByUserId', user.id)
    .eq('isActive', true)
    .maybeSingle()

  return {
    success: true,
    data: {
      user,
      profile,
      company: recruiterAccess?.Company,
    },
  }
}