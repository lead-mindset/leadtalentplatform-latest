'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { RecruiterService } from '@/lib/services/recruiter.service'
import { CompanyService } from '@/lib/services/company.service'
import type {
  TalentPoolFilters,
  TalentPoolPagination,
  TalentPoolStudent,
} from '@/lib/services/recruiter.service'

export async function getTalentPool(filters: TalentPoolFilters, pagination?: TalentPoolPagination) {
  const supabase = await createClient()
  return RecruiterService.getTalentPool(supabase, filters, pagination)
}

export async function getSavedStudents(filters: TalentPoolFilters, pagination?: TalentPoolPagination) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      students: [] as TalentPoolStudent[],
      total: 0,
      page: 1,
      pageSize: pagination?.pageSize ?? 12,
      totalPages: 0,
      hasNextPage: false,
    }
  }

  return RecruiterService.getSavedStudents(supabase, authUser.id, filters, pagination)
}

export async function getTalentPoolFilterOptions() {
  const supabase = await createClient()
  return RecruiterService.getTalentPoolFilterOptions(supabase)
}

export async function getSavedStatus(studentIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser || studentIds.length === 0) return []

  return RecruiterService.getSavedStatus(supabase, authUser.id, studentIds)
}

export async function saveStudent(studentId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { success: false, error: 'Not authenticated.' }

  const result = await CompanyService.toggleSaveStudent(supabase, authUser.id, studentId)
  if (!result.success || !result.isSaved) {
    return { success: false, error: result.error ?? 'Failed to save student.' }
  }

  revalidatePath('/company/browse')
  revalidatePath('/company/saved')
  revalidatePath(`/company/students/${studentId}`)
  return { success: true }
}

export async function unsaveStudent(studentId: string) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { success: false, error: 'Not authenticated.' }

  const result = await CompanyService.toggleSaveStudent(supabase, authUser.id, studentId)
  if (!result.success || result.isSaved) {
    return { success: false, error: result.error ?? 'Failed to remove saved student.' }
  }

  revalidatePath('/company/browse')
  revalidatePath('/company/saved')
  revalidatePath(`/company/students/${studentId}`)
  return { success: true }
}
