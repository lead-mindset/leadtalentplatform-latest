'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { AdminService } from '@/lib/services/admin.service'

interface CreateCompanyInput {
  name: string
}

type CreateCompanyResponse = 
  | { success: true; companyId: string }
  | { success: false; error: string }

export async function createCompany(
  input: CreateCompanyInput
): Promise<CreateCompanyResponse> {
  try {
    const { supabase, user } = await requireAdmin()

    if (!input.name || input.name.trim().length < 2) {
      return {
        success: false,
        error: 'Company name must be at least 2 characters long',
      }
    }

    const result = await AdminService.createCompany(supabase, {
      name: input.name.trim(),
      createdById: user.id,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidatePath('/admin/companies')

    return {
      success: true,
      companyId: result.companyId,
    }
  } catch (err) {
    console.error('Unexpected error creating company:', err)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
