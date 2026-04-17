'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'

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

    const { data, error } = await supabase
      .from('company')
      .insert({
        name: input.name.trim(),
        created_by_id: user.id,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A company with this name already exists',
        }
      }

      console.error('Error creating company:', error)
      return {
        success: false,
        error: 'Failed to create company',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create company',
      }
    }

    revalidatePath('/admin/companies')

    return {
      success: true,
      companyId: data.id,
    }
  } catch (err) {
    console.error('Unexpected error creating company:', err)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}