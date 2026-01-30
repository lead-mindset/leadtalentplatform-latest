'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateCompanyInput {
  name: string
  createdById: string
}

interface CreateCompanyResponse {
  success: boolean
  error?: string
  companyId?: string
}

export async function createCompany(
  input: CreateCompanyInput
): Promise<CreateCompanyResponse> {
  try {
    const supabase = await createClient()

    if (!input.name || input.name.trim().length < 2) {
      return {
        success: false,
        error: 'Company name must be at least 2 characters long',
      }
    }

    if (!input.createdById) {
      return {
        success: false,
        error: 'User ID is required',
      }
    }

    const { data, error } = await supabase
      .from('Company')
      .insert({
        name: input.name.trim(),
        createdbyid: input.createdById,
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